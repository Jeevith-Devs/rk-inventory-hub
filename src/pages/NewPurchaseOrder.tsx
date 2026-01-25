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
    const { toast } = useToast();

    const createPO = useCreatePurchaseOrder();
    const updatePO = useUpdatePurchaseOrder();
    const { data: existingPO, isLoading: isLoadingPO } = usePurchaseOrder(id || '');

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

    // Generate Auto PO Number on Load
    useEffect(() => {
        if (!isEditMode) {
            const generatePONumber = async () => {
                const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true });
                const nextNum = (count || 0) + 1;
                const currentYear = new Date().getFullYear().toString().slice(-2);
                const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);
                form.setValue('po_number', `SMR-PO-${String(nextNum).padStart(3, '0')}/${currentYear}-${nextYear}`);
            };
            generatePONumber();
        }
    }, [isEditMode, form]);

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

    if (isLoadingPO) return <div>Loading...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/purchase-orders')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">{isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-card">
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
                            <FormItem>
                                <FormLabel>Date</FormLabel>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-card">
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
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg bg-card p-4">
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Order Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', order_quantity: 1, unit_rate: 0, tax_percent: 18 })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                                    <div className="col-span-4">
                                        <FormField control={form.control} name={`items.${index}.product_id`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={cn(index !== 0 && "sr-only")}>Product</FormLabel>
                                                <Select onValueChange={(val) => {
                                                    field.onChange(val);
                                                    const prod = products?.find(p => p.id === val);
                                                    if (prod) {
                                                        form.setValue(`items.${index}.unit_rate`, prod.purchase_price || 0);
                                                        form.setValue(`items.${index}.tax_percent`, prod.gst_rate || 18);
                                                    }
                                                }} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {products?.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.product_code})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="col-span-2">
                                        <FormField control={form.control} name={`items.${index}.order_quantity`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={cn(index !== 0 && "sr-only")}>Quantity</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="col-span-2">
                                        <FormField control={form.control} name={`items.${index}.unit_rate`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={cn(index !== 0 && "sr-only")}>Rate</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="col-span-2">
                                        <FormField control={form.control} name={`items.${index}.tax_percent`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={cn(index !== 0 && "sr-only")}>Tax %</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="col-span-2 mt-auto">
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mt-6">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax (GST):</span>
                                    <span>₹{totals.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total:</span>
                                    <span>₹{totals.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <FormField control={form.control} name="terms_conditions" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Terms & Conditions</FormLabel>
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

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/purchase-orders')}>Cancel</Button>
                        <Button type="submit" disabled={createPO.isPending || updatePO.isPending}>
                            {createPO.isPending || updatePO.isPending ? 'Saving...' : 'Save Purchase Order'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
