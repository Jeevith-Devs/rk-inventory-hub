import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { useCreateSale } from '@/hooks/useSales';
import { useBuyers, useCreateBuyer, type BuyerInput } from '@/hooks/useBuyers';
import { useProducts } from '@/hooks/useProducts';
import { useNextInvoiceNumber } from '@/hooks/useInvoiceSequence';
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Constants } from '@/integrations/supabase/types';

const saleSchema = z.object({
  buyer_id: z.string().min(1, 'Customer is required'),
  sale_date: z.string().min(1, 'Sale date is required'),
  is_gst_invoice: z.boolean().default(true),
  payment_mode: z.enum(['Cash', 'UPI', 'NEFT', 'Credit', 'Cheque']).default('Credit'),
  transport_mode: z.enum(['Road', 'Courier', 'Pickup', 'Rail', 'Air']).default('Road'),
  vehicle_no: z.string().optional(),
  lr_no: z.string().optional(),
  dispatch_date: z.string().optional(),
  purchase_order_no: z.string().optional(),
  purchase_order_date: z.string().optional(),
  transport_charges: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const buyerSchema = z.object({
  buyer_code: z.string().min(1, 'Buyer code is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().optional(),
  billing_address: z.string().optional(),
  delivery_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gst_no: z.string().optional(),
  payment_terms: z.string().optional(),
  credit_limit: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
});

type SaleFormData = z.infer<typeof saleSchema>;
type BuyerFormData = z.infer<typeof buyerSchema>;

interface SaleItem {
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

interface SaleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SaleForm({ onSuccess, onCancel }: SaleFormProps) {
  const { data: buyers } = useBuyers();
  const { data: products } = useProducts();
  const createSale = useCreateSale();
  const createBuyer = useCreateBuyer();
  const { data: invoiceNumber } = useNextInvoiceNumber();

  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showNewBuyerDialog, setShowNewBuyerDialog] = useState(false);
  const [newBuyerMode, setNewBuyerMode] = useState(false);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      buyer_id: '',
      sale_date: format(new Date(), 'yyyy-MM-dd'),
      is_gst_invoice: true,
      payment_mode: 'Credit',
      transport_mode: 'Road',
      vehicle_no: '',
      lr_no: '',
      dispatch_date: '',
      purchase_order_no: '',
      purchase_order_date: '',
      transport_charges: 0,
      notes: '',
    },
  });

  const addItem = () => {
    const product = products?.find((p) => p.id === selectedProduct);
    if (!product || quantity <= 0) return;

    // Check stock availability
    if ((product.current_stock || 0) < quantity) {
      alert(`Insufficient stock. Available: ${product.current_stock}`);
      return;
    }

    const unitPrice = product.selling_price || 0;
    const taxPercent = product.tax_percent || 0;
    const discountPercent = product.discount_percent || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    const totalAmount = taxableAmount + taxAmount;

    const newItem: SaleItem = {
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

  const transportCharges = form.watch('transport_charges') || 0;
  const grandTotal = totals.total + transportCharges;

  const handleSubmit = (data: SaleFormData) => {
    if (items.length === 0) return;
    if (!invoiceNumber) {
      alert('Generating invoice number, please wait...');
      return;
    }

    const halfTax = totals.tax / 2;

    createSale.mutate(
      {
        sale: {
          invoice_number: invoiceNumber,
          buyer_id: data.buyer_id,
          sale_date: data.sale_date,
          is_gst_invoice: data.is_gst_invoice,
          payment_mode: data.payment_mode,
          transport_mode: data.transport_mode,
          vehicle_no: data.vehicle_no || null,
          lr_no: data.lr_no || null,
          dispatch_date: data.dispatch_date || null,
          purchase_order_no: data.purchase_order_no || null,
          purchase_order_date: data.purchase_order_date || null,
          transport_charges: transportCharges,
          subtotal: totals.subtotal,
          discount_amount: totals.discount,
          cgst_amount: data.is_gst_invoice ? halfTax : 0,
          sgst_amount: data.is_gst_invoice ? halfTax : 0,
          igst_amount: data.is_gst_invoice ? 0 : totals.tax,
          total_amount: totals.total,
          round_off: 0,
          created_by: null,
          grand_total: grandTotal,
          notes: data.notes || null,
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
            name="buyer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select onValueChange={(value) => {
                      if (value === '__new__') {
                        setShowNewBuyerDialog(true);
                      } else {
                        field.onChange(value);
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__new__" className="bg-blue-50">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add New Customer
                          </div>
                        </SelectItem>
                        {buyers
                          ?.filter((b) => b.is_active)
                          .map((buyer) => (
                            <SelectItem key={buyer.id} value={buyer.id}>
                              {buyer.company_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewBuyerDialog(true)}
                    title="Add New Customer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sale_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Constants.public.Enums.payment_mode.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_gst_invoice"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 pt-6">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">GST Invoice</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Transport Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <FormField
            control={form.control}
            name="transport_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transport Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Constants.public.Enums.transport_mode.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicle_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle No</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lr_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LR No</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dispatch_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dispatch Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transport_charges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transport Charges</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Purchase Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_order_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order No</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., PO-001, 647/25-26" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchase_order_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order Date</FormLabel>
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
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    ?.filter((p) => p.status === 'active')
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock: {product.current_stock}) - ₹{product.selling_price}
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
                <span>Discount:</span>
                <span>-₹{totals.discount.toFixed(2)}</span>
              </div>
              {form.watch('is_gst_invoice') ? (
                <>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>₹{(totals.tax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>₹{(totals.tax / 2).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>IGST:</span>
                  <span>₹{totals.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Transport:</span>
                <span>₹{transportCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
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
          <Button type="submit" disabled={items.length === 0 || createSale.isPending}>
            {createSale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Invoice
          </Button>
        </div>

        {/* New Customer Dialog */}
        <NewCustomerDialog
          open={showNewBuyerDialog}
          onOpenChange={setShowNewBuyerDialog}
          onCustomerCreated={(buyerId) => {
            form.setValue('buyer_id', buyerId);
            setShowNewBuyerDialog(false);
          }}
          isLoading={createBuyer.isPending}
        />
      </form>
    </Form>
  );
}

interface NewCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (buyerId: string) => void;
  isLoading: boolean;
}

function NewCustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
  isLoading,
}: NewCustomerDialogProps) {
  const createBuyer = useCreateBuyer();
  const buyerForm = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      buyer_code: `BUY-${Date.now().toString().slice(-6)}`,
      company_name: '',
      contact_person: '',
      billing_address: '',
      delivery_address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      gst_no: '',
      payment_terms: '',
      credit_limit: 0,
      is_active: true,
    },
  });

  const handleSubmit = (data: BuyerFormData) => {
    const buyerInput: BuyerInput = {
      buyer_code: data.buyer_code,
      company_name: data.company_name,
      is_active: data.is_active,
      contact_person: data.contact_person || null,
      billing_address: data.billing_address || null,
      delivery_address: data.delivery_address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      phone: data.phone || null,
      email: data.email || null,
      gst_no: data.gst_no || null,
      payment_terms: data.payment_terms || null,
      credit_limit: data.credit_limit || null,
    };

    createBuyer.mutate(buyerInput, {
      onSuccess: (newBuyer) => {
        buyerForm.reset();
        onCustomerCreated(newBuyer.id);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <Form {...buyerForm}>
          <form onSubmit={buyerForm.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={buyerForm.control}
                name="buyer_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer Code *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="gst_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST No</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Address Information</h4>
              <FormField
                control={buyerForm.control}
                name="billing_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="delivery_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={buyerForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={buyerForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={buyerForm.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={buyerForm.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buyerForm.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
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

            <FormField
              control={buyerForm.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  buyerForm.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Customer & Select
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
