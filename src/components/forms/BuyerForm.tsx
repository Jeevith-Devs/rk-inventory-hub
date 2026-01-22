import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
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
import { Buyer, BuyerInput } from '@/hooks/useBuyers';
import { useNextBuyerCode } from '@/hooks/useInvoiceSequence';
import { Loader2 } from 'lucide-react';

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

type BuyerFormData = z.infer<typeof buyerSchema>;

interface BuyerFormProps {
  buyer?: Buyer;
  onSubmit: (data: BuyerInput) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function BuyerForm({ buyer, onSubmit, isLoading, onCancel }: BuyerFormProps) {
  const { data: nextBuyerCode } = useNextBuyerCode();
  
  const form = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      buyer_code: buyer?.buyer_code || '',
      company_name: buyer?.company_name || '',
      contact_person: buyer?.contact_person || '',
      billing_address: buyer?.billing_address || '',
      delivery_address: buyer?.delivery_address || '',
      city: buyer?.city || '',
      state: buyer?.state || '',
      pincode: buyer?.pincode || '',
      phone: buyer?.phone || '',
      email: buyer?.email || '',
      gst_no: buyer?.gst_no || '',
      payment_terms: buyer?.payment_terms || '',
      credit_limit: buyer?.credit_limit ?? '',
      is_active: buyer?.is_active ?? true,
    },
  });

  // Set the buyer code when creating a new buyer
  useEffect(() => {
    if (!buyer && nextBuyerCode) {
      form.setValue('buyer_code', nextBuyerCode);
    }
  }, [buyer, nextBuyerCode, form]);

  const handleSubmit = (data: BuyerFormData) => {
    onSubmit({
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
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buyer_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buyer Code *</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!!buyer} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
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
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gst_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Addresses */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Addresses</h3>
          <FormField
            control={form.control}
            name="billing_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="Billing address" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="delivery_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="Delivery address (if different)" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Payment Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Net 30" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="credit_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit (₹)</FormLabel>
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

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel className="text-base">Active</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Inactive buyers won't appear in selections
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buyer ? 'Update' : 'Create'} Buyer
          </Button>
        </div>
      </form>
    </Form>
  );
}
