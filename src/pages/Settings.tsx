import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/useDashboard';
import { Loader2, Building2, CreditCard, FileText } from 'lucide-react';

const settingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
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
  terms_conditions: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: '',
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
      terms_conditions: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        pincode: settings.pincode || '',
        phone: settings.phone || '',
        email: settings.email || '',
        gst_no: settings.gst_no || '',
        pan_no: settings.pan_no || '',
        bank_name: settings.bank_name || '',
        bank_account_no: settings.bank_account_no || '',
        bank_ifsc: settings.bank_ifsc || '',
        bank_branch: settings.bank_branch || '',
        terms_conditions: settings.terms_conditions || '',
      });
    }
  }, [settings, form]);

  const handleSubmit = (data: SettingsFormData) => {
    if (!settings?.id) return;
    updateSettings.mutate({
      id: settings.id,
      ...data,
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
      terms_conditions: data.terms_conditions || null,
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Settings">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Company Settings">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details that appear on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="pan_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
              <CardDescription>
                Bank information for payment collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_account_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_ifsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms & Conditions
              </CardTitle>
              <CardDescription>
                Default terms that appear on invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="terms_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder="Enter terms and conditions that will appear on invoices..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
