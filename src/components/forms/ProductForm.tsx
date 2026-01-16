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
import { Product, ProductInput, useCategories } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Loader2 } from 'lucide-react';
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

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductInput) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, isLoading, onCancel }: ProductFormProps) {
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();

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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers?.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
      </form>
    </Form>
  );
}
