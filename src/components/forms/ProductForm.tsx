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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product, ProductInput, useCategories } from '@/hooks/useProducts';
import { useSuppliers, useCreateSupplier, type SupplierInput } from '@/hooks/useSuppliers';
import { Loader2, Plus, UserPlus } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

const productSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  default_supplier_id: z.string().optional(),
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

const supplierSchema = z.object({
  supplier_code: z.string().min(1, 'Supplier code is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gst_no: z.string().optional(),
  pan_no: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_ifsc: z.string().optional(),
  bank_branch: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;
type SupplierFormData = z.infer<typeof supplierSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductInput) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, isLoading, onCancel }: ProductFormProps) {
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const createSupplier = useCreateSupplier();

  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_code: product?.product_code || `PRD-${Date.now().toString().slice(-6)}`,
      name: product?.name || '',
      description: product?.description || '',
      category_id: product?.category_id || '',
      default_supplier_id: product?.default_supplier_id || '',
      unit: product?.unit || 'PCS',
      hsn_code: product?.hsn_code || '',
      purchase_price: product?.purchase_price || 0,
      selling_price: product?.selling_price || 0,
      tax_percent: product?.tax_percent || 18,
      discount_percent: product?.discount_percent || 0,
      current_stock: product?.current_stock || 0,
      reorder_level: product?.reorder_level || 10,
      status: product?.status || 'active',
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    onSubmit({
      product_code: data.product_code,
      name: data.name,
      description: data.description || null,
      category_id: data.category_id || null,
      default_supplier_id: data.default_supplier_id || null,
      unit: data.unit,
      hsn_code: data.hsn_code || null,
      purchase_price: data.purchase_price,
      selling_price: data.selling_price,
      tax_percent: data.tax_percent,
      discount_percent: data.discount_percent,
      current_stock: data.current_stock,
      reorder_level: data.reorder_level,
      status: data.status,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="product_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Code *</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!!product} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
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
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Supplier</FormLabel>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select onValueChange={(value) => {
                      if (value === '__new__') {
                        setShowNewSupplierDialog(true);
                      } else {
                        field.onChange(value);
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__new__" className="bg-blue-50">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add New Supplier
                          </div>
                        </SelectItem>
                        {suppliers?.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewSupplierDialog(true)}
                    title="Add New Supplier"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Constants.public.Enums.unit_type.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="hsn_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSN Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="selling_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax %</FormLabel>
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
        </div>

        {/* Stock */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="current_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={!!product}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorder_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Level</FormLabel>
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
            <FormField
              control={form.control}
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
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Update' : 'Create'} Product
          </Button>
        </div>

        {/* New Supplier Dialog */}
        <NewSupplierDialog
          open={showNewSupplierDialog}
          onOpenChange={setShowNewSupplierDialog}
          onSupplierCreated={(supplierId) => {
            form.setValue('default_supplier_id', supplierId);
            setShowNewSupplierDialog(false);
          }}
          isLoading={createSupplier.isPending}
        />
      </form>
    </Form>
  );
}

interface NewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierCreated: (supplierId: string) => void;
  isLoading: boolean;
}

function NewSupplierDialog({
  open,
  onOpenChange,
  onSupplierCreated,
  isLoading,
}: NewSupplierDialogProps) {
  const createSupplier = useCreateSupplier();
  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_code: `SUP-${Date.now().toString().slice(-6)}`,
      company_name: '',
      contact_person: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      gst_no: '',
      pan_no: '',
      bank_name: '',
      bank_account_no: '',
      bank_ifsc: '',
      bank_branch: '',
      notes: '',
      is_active: true,
    },
  });

  const handleSubmit = (data: SupplierFormData) => {
    const supplierInput: SupplierInput = {
      supplier_code: data.supplier_code,
      company_name: data.company_name,
      is_active: data.is_active,
      contact_person: data.contact_person || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      phone: data.phone || null,
      email: data.email || null,
      gst_no: data.gst_no || null,
      pan_no: data.pan_no || null,
      bank_name: data.bank_name || null,
      bank_account_no: data.bank_account_no || null,
      bank_ifsc: data.bank_ifsc || null,
      bank_branch: data.bank_branch || null,
      notes: data.notes || null,
    };

    createSupplier.mutate(supplierInput, {
      onSuccess: (newSupplier) => {
        supplierForm.reset();
        onSupplierCreated(newSupplier.id);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>

        <Form {...supplierForm}>
          <form onSubmit={supplierForm.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={supplierForm.control}
                name="supplier_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Code *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={supplierForm.control}
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
                control={supplierForm.control}
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
                control={supplierForm.control}
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
                control={supplierForm.control}
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
                control={supplierForm.control}
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
                control={supplierForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={supplierForm.control}
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
                  control={supplierForm.control}
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
                  control={supplierForm.control}
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

            {/* Tax Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={supplierForm.control}
                name="pan_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN No</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bank Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Bank Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={supplierForm.control}
                  name="bank_account_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account No</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={supplierForm.control}
                  name="bank_ifsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={supplierForm.control}
                  name="bank_branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={supplierForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
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
                  supplierForm.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Supplier & Select
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
