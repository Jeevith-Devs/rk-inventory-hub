import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreatePurchase } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts, useCreateProduct, type ProductInput, type UnitType } from '@/hooks/useProducts';
import { Loader2, Plus, Trash2, PackagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { Constants } from '@/integrations/supabase/types';

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  notes: z.string().optional(),
});

const productSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  unit: z.enum(['PCS', 'BOX', 'KG', 'MTR', 'LTR', 'SET', 'PAIR']).default('PCS'),
  hsn_code: z.string().optional(),
  purchase_price: z.number().min(0).default(0),
  selling_price: z.number().min(0).default(0),
  tax_percent: z.number().min(0).max(100).default(18),
  discount_percent: z.number().min(0).max(100).default(0),
  current_stock: z.number().min(0).default(0),
  reorder_level: z.number().min(0).default(10),
  status: z.enum(['active', 'inactive']).default('active'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;
type ProductFormData = z.infer<typeof productSchema>;

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
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseForm({ onSuccess, onCancel }: PurchaseFormProps) {
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const createPurchase = useCreatePurchase();
  const createProduct = useCreateProduct();

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);

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

  const addItem = () => {
    const product = products?.find((p) => p.id === selectedProduct);
    if (!product || quantity <= 0) return;

    const unitPrice = product.purchase_price || 0;
    const taxPercent = product.tax_percent || 0;
    const discountPercent = product.discount_percent || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    const totalAmount = taxableAmount + taxAmount;

    const newItem: PurchaseItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      tax_percent: taxPercent,
      discount_percent: discountPercent,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
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

  const handleSubmit = (data: PurchaseFormData) => {
    if (items.length === 0) return;

    const purchaseNumber = `PUR-${Date.now().toString().slice(-8)}`;

    createPurchase.mutate(
      {
        purchase: {
          purchase_number: purchaseNumber,
          supplier_id: data.supplier_id,
          purchase_date: data.purchase_date,
          invoice_number: data.invoice_number || null,
          invoice_date: data.invoice_date || null,
          subtotal: totals.subtotal,
          discount_amount: totals.discount,
          tax_amount: totals.tax,
          total_amount: totals.total,
          notes: data.notes || null,
          bill_image_url: null,
          created_by: null,
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percent: item.tax_percent,
          discount_percent: item.discount_percent,
          tax_amount: item.tax_amount,
          discount_amount: item.discount_amount,
          total_amount: item.total_amount,
        })),
      },
      { onSuccess }
    );
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {/* Add Item */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Add Items</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Product</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedProduct} onValueChange={(value) => {
                    if (value === '__new__') {
                      setShowNewProductDialog(true);
                    } else {
                      setSelectedProduct(value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__" className="bg-blue-50">
                        <div className="flex items-center gap-2">
                          <PackagePlus className="h-4 w-4" />
                          Add New Product
                        </div>
                      </SelectItem>
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewProductDialog(true)}
                  title="Add New Product"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
          <Button type="submit" disabled={items.length === 0 || createPurchase.isPending}>
            {createPurchase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Purchase
          </Button>
        </div>

        {/* New Product Dialog */}
        <NewProductDialog
          open={showNewProductDialog}
          onOpenChange={setShowNewProductDialog}
          onProductCreated={(productId) => {
            setSelectedProduct(productId);
            setShowNewProductDialog(false);
          }}
          isLoading={createProduct.isPending}
        />
      </form>
    </Form>
  );
}

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (productId: string) => void;
  isLoading: boolean;
}

function NewProductDialog({
  open,
  onOpenChange,
  onProductCreated,
  isLoading,
}: NewProductDialogProps) {
  const createProduct = useCreateProduct();
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_code: `PRD-${Date.now().toString().slice(-6)}`,
      name: '',
      description: '',
      unit: 'PCS',
      hsn_code: '',
      purchase_price: 0,
      selling_price: 0,
      tax_percent: 18,
      discount_percent: 0,
      current_stock: 0,
      reorder_level: 10,
      status: 'active',
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    const productInput: ProductInput = {
      product_code: data.product_code,
      name: data.name,
      description: data.description || null,
      category_id: null,
      unit: data.unit as UnitType,
      hsn_code: data.hsn_code || null,
      purchase_price: data.purchase_price,
      selling_price: data.selling_price,
      tax_percent: data.tax_percent,
      discount_percent: data.discount_percent,
      current_stock: data.current_stock,
      reorder_level: data.reorder_level,
      default_supplier_id: null,
      status: data.status,
    };

    createProduct.mutate(productInput, {
      onSuccess: (newProduct) => {
        productForm.reset();
        onProductCreated(newProduct.id);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <Form {...productForm}>
          <form onSubmit={productForm.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={productForm.control}
                name="product_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={productForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={productForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Constants.public.Enums.unit.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="tax_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax % *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="discount_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount %</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Stock Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Stock Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="current_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="reorder_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={productForm.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  productForm.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Product & Select
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
