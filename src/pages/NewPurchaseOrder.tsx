import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreatePurchaseOrder, useUpdatePurchaseOrder, usePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useNextPurchaseNumber } from '@/hooks/useInvoiceSequence';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Schema Validation
const purchaseOrderSchema = z.object({
    po_number: z.string().min(1, 'PO Number is required'),
    po_date: z.date(),
    vendor_id: z.string().min(1, 'Vendor is required'),
    quotation_ref: z.string().optional(),
    payment_term: z.string().optional(),
    transportation: z.string().optional(),
    delivery_term: z.string().optional(),
    notes: z.string().optional(),
    terms_conditions: z.string().optional(),
    items: z.array(
        z.object({
            product_id: z.string().min(1, 'Product is required'),
            order_quantity: z.coerce.number().min(1, 'Quantity must be positive'),
            unit_rate: z.coerce.number().min(0, 'Rate must be positive'),
            tax_percent: z.coerce.number().min(0).optional(),
        })
    ).min(1, 'Add at least one item'),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function PurchaseOrderFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const createPO = useCreatePurchaseOrder();
    const updatePO = useUpdatePurchaseOrder();
    const { data: existingPO, isLoading: isLoadingPO } = usePurchaseOrder(id || '');
    const { data: nextPONumber } = useNextPurchaseNumber();

    // Fetch Vendors and Products
    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const { data } = await supabase.from('suppliers').select('*').order('company_name');
            return data || [];
        },
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await supabase.from('products').select('*').order('name');
            return data || [];
        },
    });

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderSchema),
        defaultValues: {
            po_number: '',
            po_date: new Date(),
            quotation_ref: '',
            payment_term: '30 Days',
            transportation: 'Ours Scope',
            delivery_term: '3 Days',
            items: [{ product_id: '', order_quantity: 1, unit_rate: 0, tax_percent: 18 }],
            terms_conditions: `1. Delivery with in 3 to 5 days from purchase order
2. Payment with in 30 days from date of invoice
3. Price revision applicable whenever there is increase or decrease in the raw materials price, The same to intimated in advance and mutually agreed
4. Kindly Supply The Materials As Per Drawing
5. Price revision applicable whenever there is increase or decrease in the raw materials price`
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // Calculate Totals Live
    const watchedItems = form.watch('items');
    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, grandTotal: 0 });

    useEffect(() => {
        let sub = 0;
        let tx = 0;

        watchedItems.forEach((item) => {
            const qty = Number(item.order_quantity) || 0;
            const rate = Number(item.unit_rate) || 0;
            const taxPer = Number(item.tax_percent) || 0;

            const basic = qty * rate;
            const taxAmt = (basic * taxPer) / 100;

            sub += basic;
            tx += taxAmt;
        });

        setTotals({
            subtotal: sub,
            tax: tx,
            grandTotal: sub + tx,
        });
    }, [watchedItems]);

    // Auto-fill PO Number with financial-year-aware sequence on Load
    useEffect(() => {
        if (!isEditMode && nextPONumber) {
            form.setValue('po_number', nextPONumber);
        }
    }, [isEditMode, nextPONumber, form]);

    // Load Existing Data for Edit
    useEffect(() => {
        if (existingPO) {
            form.reset({
                po_number: existingPO.po_number,
                po_date: new Date(existingPO.po_date),
                vendor_id: existingPO.vendor_id,
                quotation_ref: existingPO.quotation_ref || '',
                payment_term: existingPO.payment_term || '',
                transportation: existingPO.transportation || '',
                delivery_term: existingPO.delivery_term || '',
                notes: existingPO.notes || '',
                terms_conditions: existingPO.terms_conditions || '',
                items: existingPO.purchase_order_items?.map(item => ({
                    product_id: item.product_id,
                    order_quantity: Number(item.order_quantity),
                    unit_rate: Number(item.unit_rate),
                    tax_percent: Number(item.tax_percent),
                })) || [],
            });
        }
    }, [existingPO, form]);

    const onSubmit = (data: PurchaseOrderFormValues) => {
        const formattedItems = data.items.map(item => {
            const basic = item.order_quantity * item.unit_rate;
            const taxAmt = (basic * (item.tax_percent || 0)) / 100;
            return {
                product_id: item.product_id,
                order_quantity: item.order_quantity,
                unit_rate: item.unit_rate,
                total_basic: basic,
                tax_percent: item.tax_percent,
                sgst_amount: taxAmt / 2,
                cgst_amount: taxAmt / 2,
                igst_amount: 0,
                order_value: basic + taxAmt,
            };
        });

        const poData = {
            po_number: data.po_number,
            po_date: data.po_date.toISOString(),
            vendor_id: data.vendor_id,
            quotation_ref: data.quotation_ref,
            payment_term: data.payment_term,
            transportation: data.transportation,
            delivery_term: data.delivery_term,
            subtotal: totals.subtotal,
            sgst_amount: totals.tax / 2,
            cgst_amount: totals.tax / 2,
            igst_amount: 0,
            total_amount: totals.grandTotal,
            grand_total: totals.grandTotal,
            notes: data.notes,
            terms_conditions: data.terms_conditions,
            created_by: user?.id || null,
            round_off: 0,
            revision_no: existingPO?.revision_no || 'R1',
            is_gst_po: true,
        };

        if (isEditMode && id) {
            updatePO.mutate({ poId: id, purchaseOrder: poData, items: formattedItems }, {
                onSuccess: () => navigate('/purchase-orders')
            });
        } else {
            createPO.mutate({ purchaseOrder: poData, items: formattedItems }, {
                onSuccess: () => navigate('/purchase-orders')
            });
        }
    };

    if (isLoadingPO) {
        return (
            <PageContainer title={isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}>
                <div className="flex h-[400px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title={isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}
            actions={
                <Button variant="outline" size="sm" onClick={() => navigate('/purchase-orders')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                </Button>
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                    {/* Header Fields */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="po_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PO Number</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="vendor_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {suppliers?.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="po_date" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="mb-2">Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Additional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField control={form.control} name="quotation_ref" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quotation Ref</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="payment_term" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Term</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="transportation" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transportation</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="delivery_term" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delivery Term</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    {/* Items Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-sm font-medium">Order Items</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', order_quantity: 1, unit_rate: 0, tax_percent: 18 })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 rounded-lg bg-muted/30 border border-dashed relative">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-5">
                                            <FormField control={form.control} name={`items.${index}.product_id`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product</FormLabel>
                                                    <Select onValueChange={(val) => {
                                                        field.onChange(val);
                                                        const prod = products?.find(p => p.id === val);
                                                        if (prod) {
                                                            form.setValue(`items.${index}.unit_rate`, prod.purchase_price || 0);
                                                            form.setValue(`items.${index}.tax_percent`, prod.gst_rate || 18);
                                                        }
                                                    }} value={field.value}>
                                                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {products?.map(p => (
                                                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.product_code})</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-3 md:col-span-6 gap-4">
                                            <FormField control={form.control} name={`items.${index}.order_quantity`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Qty</FormLabel>
                                                    <FormControl><Input type="number" className="bg-background" {...field} /></FormControl>
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name={`items.${index}.unit_rate`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Rate</FormLabel>
                                                    <FormControl><Input type="number" className="bg-background" {...field} /></FormControl>
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name={`items.${index}.tax_percent`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tax %</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" className="bg-background" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="flex justify-end md:col-span-1">
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)} disabled={fields.length === 1}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Totals */}
                            <div className="flex justify-end pt-4 border-t">
                                <div className="w-full sm:w-80 space-y-3 p-4 bg-muted/20 rounded-lg">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-foreground">₹{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Total GST</span>
                                        <span className="font-medium text-foreground">₹{totals.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-xl pt-2 border-t border-muted text-primary">
                                        <span>Total Amount</span>
                                        <span>₹{totals.grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Terms & Conditions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField control={form.control} name="terms_conditions" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Specific terms for this order..."
                                            className="min-h-[150px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" size="lg" onClick={() => navigate('/purchase-orders')} className="w-full sm:w-auto px-10">
                            Cancel
                        </Button>
                        <Button type="submit" size="lg" disabled={createPO.isPending || updatePO.isPending} className="w-full sm:w-auto px-10 shadow-lg shadow-primary/20">
                            {createPO.isPending || updatePO.isPending ? 'Saving...' : 'Save Purchase Order'}
                        </Button>
                    </div>
                </form>
            </Form>
        </PageContainer>
    );
}
