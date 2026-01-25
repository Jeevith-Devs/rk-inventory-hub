import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreatePurchase, useUpdatePurchase, PurchaseWithItems } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useNextPurchaseNumber } from '@/hooks/useInvoiceSequence';
import { Loader2, Plus, Trash2, Upload, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  discount_percent: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
}

interface PurchaseFormProps {
  initialData?: PurchaseWithItems | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseForm({ initialData, onSuccess, onCancel }: PurchaseFormProps) {
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const { data: purchaseNumber } = useNextPurchaseNumber();
  const { toast } = useToast();

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDriveLink, setExistingDriveLink] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      invoice_number: '',
      invoice_date: '',
      notes: '',
    },
  });

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      form.reset({
        supplier_id: initialData.supplier_id,
        purchase_date: initialData.purchase_date,
        invoice_number: initialData.invoice_number || '',
        invoice_date: initialData.invoice_date || '',
        notes: initialData.notes || '',
      });

      if (initialData.purchase_items) {
        setItems(initialData.purchase_items.map(item => ({
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percent: item.tax_percent || 0,
          discount_percent: item.discount_percent || 0,
          tax_amount: item.tax_amount || 0,
          discount_amount: item.discount_amount || 0,
          total_amount: item.total_amount,
        })));
      }

      if (initialData.bill_image_url) {
        setExistingDriveLink(initialData.bill_image_url);
      }
    }
  }, [initialData, form]);

  const addItem = () => {
    const product = products?.find((p) => p.id === selectedProduct);
    const qty = Number(quantity);
    if (!product || !quantity || qty <= 0) return;

    const unitPrice = product.purchase_price || 0;
    const taxPercent = product.tax_percent || 0;
    const discountPercent = product.discount_percent || 0;

    const subtotal = qty * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    const totalAmount = taxableAmount + taxAmount;

    const newItem: PurchaseItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price: unitPrice,
      tax_percent: taxPercent,
      discount_percent: discountPercent,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setExistingDriveLink(null); // Clear existing link if new file is selected
    }
  };

  const uploadFileToDrive = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `${initialData?.purchase_number || purchaseNumber}_${file.name}`);

      const { data, error } = await supabase.functions.invoke('upload-to-drive', {
        body: formData,
      });

      if (error) throw error;
      return data.webViewLink;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload invoice to Google Drive.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.quantity * item.unit_price,
      discount: acc.discount + item.discount_amount,
      tax: acc.tax + item.tax_amount,
      total: acc.total + item.total_amount,
    }),
    { subtotal: 0, discount: 0, tax: 0, total: 0 }
  );

  const handleSubmit = async (data: PurchaseFormData) => {
    if (items.length === 0) return;

    const pNumber = initialData?.purchase_number || purchaseNumber;
    if (!pNumber) {
      alert('Generating purchase number, please wait...');
      return;
    }

    let driveLink = existingDriveLink;
    if (selectedFile) {
      driveLink = await uploadFileToDrive(selectedFile);
      if (!driveLink) return;
    }

    const purchasePayload = {
      purchase_number: pNumber,
      supplier_id: data.supplier_id,
      purchase_date: data.purchase_date,
      invoice_number: data.invoice_number || null,
      invoice_date: data.invoice_date || null,
      subtotal: totals.subtotal,
      discount_amount: totals.discount,
      tax_amount: totals.tax,
      total_amount: totals.total,
      notes: data.notes || null,
      bill_image_url: driveLink,
      created_by: initialData?.created_by || null,
    };

    const itemsPayload = items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_percent: item.tax_percent,
      discount_percent: item.discount_percent,
      tax_amount: item.tax_amount,
      discount_amount: item.discount_amount,
      total_amount: item.total_amount,
    }));

    if (initialData) {
      updatePurchase.mutate(
        { id: initialData.id, purchase: purchasePayload, items: itemsPayload },
        { onSuccess }
      );
    } else {
      createPurchase.mutate(
        { purchase: purchasePayload, items: itemsPayload },
        { onSuccess }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers
                      ?.filter((s) => s.is_active)
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Invoice Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-4 bg-muted/20 flex flex-col items-center justify-center gap-2">
          {!selectedFile && !existingDriveLink ? (
            <>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Upload Supplier Invoice</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, or PNG to Google Drive</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </>
          ) : selectedFile ? (
            <div className="flex items-center gap-3 w-full max-w-sm p-2 bg-background border rounded-md">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full max-w-sm p-2 bg-background border rounded-md">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate italic text-muted-foreground">Invoice Uploaded to Google Drive</p>
                <a href={existingDriveLink!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View on Drive</a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setExistingDriveLink(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf"
          />
        </div>

        {/* Add Item */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Add Items</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    ?.filter((p) => p.status === 'active')
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (₹{product.purchase_price})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : e.target.value)}
              />
            </div>
            <Button type="button" onClick={addItem} disabled={!selectedProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="text-right">Tax Amt</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{item.unit_price}</TableCell>
                    <TableCell className="text-right">{item.tax_percent}%</TableCell>
                    <TableCell className="text-right">₹{item.tax_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{item.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{totals.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={items.length === 0 || createPurchase.isPending || updatePurchase.isPending || isUploading}>
            {(createPurchase.isPending || updatePurchase.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading to Drive...' : initialData ? 'Update Purchase' : 'Save Purchase'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
