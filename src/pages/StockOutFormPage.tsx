import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCreateSale, useUpdateSale, useSale, embedLinkedPurchaseTag, extractLinkedPurchaseId } from '@/hooks/useSales';
import { useBuyers, useCreateBuyer } from '@/hooks/useBuyers';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { usePurchases } from '@/hooks/usePurchases';
import { useNextInvoiceNumber } from '@/hooks/useInvoiceSequence';
import { Loader2, Plus, Trash2, ArrowLeft, UserPlus, PackagePlus, Link2, X, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { BuyerForm } from '@/components/forms/BuyerForm';
import { ProductForm } from '@/components/forms/ProductForm';
import { Constants } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

type SaleFormData = z.infer<typeof saleSchema>;

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

export default function StockOutFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const { data: buyers } = useBuyers();
    const { data: products } = useProducts();
    const { data: purchases } = usePurchases();
    const createSale = useCreateSale();
    const updateSale = useUpdateSale();
    const createBuyer = useCreateBuyer();
    const createProduct = useCreateProduct();
    const { data: invoiceNumber } = useNextInvoiceNumber();
    const { data: existingSale, isLoading: isLoadingSale } = useSale(id || '');

    const [items, setItems] = useState<SaleItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [showNewBuyerDialog, setShowNewBuyerDialog] = useState(false);
    const [showNewProductDialog, setShowNewProductDialog] = useState(false);
    const [linkedPurchaseId, setLinkedPurchaseId] = useState<string>('');
    const [purchaseSearch, setPurchaseSearch] = useState('');

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

    useEffect(() => {
        if (isEditMode && existingSale) {
            form.reset({
                buyer_id: existingSale.buyer_id,
                sale_date: existingSale.sale_date,
                is_gst_invoice: existingSale.is_gst_invoice ?? true,
                payment_mode: (existingSale.payment_mode as any) || 'Credit',
                transport_mode: (existingSale.transport_mode as any) || 'Road',
                vehicle_no: existingSale.vehicle_no || '',
                lr_no: existingSale.lr_no || '',
                dispatch_date: existingSale.dispatch_date || '',
                purchase_order_no: existingSale.purchase_order_no || '',
                purchase_order_date: existingSale.purchase_order_date || '',
                transport_charges: Number(existingSale.transport_charges || 0),
                notes: existingSale.notes || '',
            });

            if (existingSale.sale_items) {
                setItems(existingSale.sale_items.map((item) => ({
                    product_id: item.product_id,
                    product_name: item.products?.name || '',
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    tax_percent: Number(item.tax_percent || 0),
                    discount_percent: Number(item.discount_percent || 0),
                    tax_amount: Number(item.tax_amount || 0),
                    discount_amount: Number(item.discount_amount || 0),
                    total_amount: Number(item.total_amount),
                })));
            }
            // Restore linked purchase from hidden tag in notes
            const linked = extractLinkedPurchaseId(existingSale.notes);
            if (linked) setLinkedPurchaseId(linked);
        }
    }, [isEditMode, existingSale, form]);

    const addItem = () => {
        const product = products?.find((p) => p.id === selectedProduct);
        const qty = Number(quantity);
        if (!product || !quantity || qty <= 0) return;

        const unitPrice = product.selling_price || 0;
        const taxPercent = product.tax_percent || 0;
        const discountPercent = product.discount_percent || 0;

        const subtotal = qty * unitPrice;
        const discountAmount = subtotal * (discountPercent / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxPercent / 100);
        const totalAmount = taxableAmount + taxAmount;

        const newItem: SaleItem = {
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

    const onSubmit = (data: SaleFormData) => {
        if (items.length === 0) return;

        const halfTax = totals.tax / 2;

        // Embed the linked purchase tag into notes (invisible in invoice PDF)
        const notesWithTag = embedLinkedPurchaseTag(data.notes || '', linkedPurchaseId || null);

        const saleData = {
            invoice_number: isEditMode ? existingSale!.invoice_number : invoiceNumber!,
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
            notes: notesWithTag || null,
            payment_status: existingSale?.payment_status || 'Unpaid',
            paid_amount: existingSale?.paid_amount || 0,
            due_date: existingSale?.due_date || null,
            payment_reference: existingSale?.payment_reference || null,
        };

        const itemsData = items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_percent: item.tax_percent,
            discount_percent: item.discount_percent,
            tax_amount: item.tax_amount,
            discount_amount: item.discount_amount,
            total_amount: item.total_amount,
        }));

        if (isEditMode) {
            updateSale.mutate(
                { saleId: id!, sale: saleData, items: itemsData },
                { onSuccess: () => navigate('/sales') }
            );
        } else {
            if (!invoiceNumber) {
                alert('Generating invoice number, please wait...');
                return;
            }
            createSale.mutate(
                { sale: saleData, items: itemsData },
                { onSuccess: () => navigate('/sales') }
            );
        }
    };

    if (isEditMode && isLoadingSale) {
        return (
            <PageContainer title="Edit Invoice">
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title={isEditMode ? `Edit Invoice: ${existingSale?.invoice_number}` : 'New Stock Out / Tax Invoice'}
            actions={
                <Button variant="outline" size="sm" onClick={() => navigate('/sales')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                </Button>
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Customer & Basic Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField
                                control={form.control}
                                name="buyer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-center mb-1">
                                            <FormLabel>Customer *</FormLabel>
                                            <Dialog open={showNewBuyerDialog} onOpenChange={setShowNewBuyerDialog}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-primary text-xs flex items-center gap-1">
                                                        <UserPlus size={12} />
                                                        New
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Add New Customer</DialogTitle>
                                                    </DialogHeader>
                                                    <BuyerForm
                                                        onSubmit={(data) => createBuyer.mutate(data, {
                                                            onSuccess: (newBuyer) => {
                                                                form.setValue('buyer_id', newBuyer.id);
                                                                setShowNewBuyerDialog(false);
                                                            }
                                                        })}
                                                        onCancel={() => setShowNewBuyerDialog(false)}
                                                        isLoading={createBuyer.isPending}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {buyers?.filter((b) => b.is_active).map((buyer) => (
                                                    <SelectItem key={buyer.id} value={buyer.id}>
                                                        {buyer.company_name}
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
                                name="sale_date"
                                render={({ field }) => (
                                    <FormItem className="pt-[26px]">
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
                                    <FormItem className="pt-[26px]">
                                        <FormLabel>Payment Mode</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue="Credit">
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
                                    <FormItem className="flex items-center gap-2 pt-[52px]">
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="!mt-0 font-semibold text-primary uppercase text-xs tracking-widest">GST Invoice</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Logistics & References</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <FormField
                                control={form.control}
                                name="transport_mode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transport Mode</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                            <Input {...field} placeholder="KA-01-XX-0000" />
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
                                            <Input {...field} placeholder="Lorry Receipt No." />
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
                                        <FormLabel>Transport Chg.</FormLabel>
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
                        </CardContent>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-0">
                            <FormField
                                control={form.control}
                                name="purchase_order_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer PO No.</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Reference PO Number" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="purchase_order_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer PO Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* ─── Link Stock In (Profit Tracking) ─────────────────────────── */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Linked Stock In (for Profit Report)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Link to Stock In Entry <span className="text-muted-foreground font-normal">(optional)</span>
                                </label>
                                <Select
                                    value={linkedPurchaseId || '__none__'}
                                    onValueChange={(val) => setLinkedPurchaseId(val === '__none__' ? '' : val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Stock In (Purchase)..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">— None / Not linked —</SelectItem>
                                        {(purchases || []).map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.purchase_number} &nbsp;|&nbsp; {p.suppliers?.company_name || '—'} &nbsp;|&nbsp; {p.purchase_date} &nbsp;|&nbsp; ₹{(p.total_amount || 0).toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Linking a Stock In allows the Reports page to show profit for this invoice.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-sm font-medium">Invoice Items</CardTitle>
                            <div className="flex gap-2">
                                <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 text-xs">
                                            <PackagePlus className="mr-2 h-3 w-3" />
                                            New Product
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Add New Product</DialogTitle>
                                        </DialogHeader>
                                        <ProductForm
                                            onSubmit={(data) => createProduct.mutate(data, {
                                                onSuccess: (newProduct) => {
                                                    setSelectedProduct(newProduct.id);
                                                    setShowNewProductDialog(false);
                                                }
                                            })}
                                            onCancel={() => setShowNewProductDialog(false)}
                                            isLoading={createProduct.isPending}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4 items-end flex-wrap p-4 bg-muted/30 rounded-lg border border-dashed">
                                <div className="flex-1 min-w-[300px]">
                                    <label className="text-xs font-semibold mb-1 block uppercase tracking-wider text-muted-foreground">Select SKU</label>
                                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Search SKU to add..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products?.filter((p) => p.status === 'active').map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.name} (Stock: {product.current_stock}) - ₹{product.selling_price}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-semibold mb-1 block uppercase tracking-wider text-muted-foreground">Quantity</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        className="bg-background"
                                        onChange={(e) => setQuantity(e.target.value === '' ? '' : e.target.value)}
                                    />
                                </div>
                                <Button type="button" onClick={addItem} disabled={!selectedProduct || !quantity} className="h-10 px-6">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add SKU
                                </Button>
                            </div>

                            {items.length > 0 ? (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="py-3">Product Description</TableHead>
                                                <TableHead className="text-right py-3">Qty</TableHead>
                                                <TableHead className="text-right py-3">Unit Price</TableHead>
                                                <TableHead className="text-right py-3">Tax %</TableHead>
                                                <TableHead className="text-right py-3">Tax Amt</TableHead>
                                                <TableHead className="text-right py-3 font-semibold">Total</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={index} className="hover:bg-muted/20">
                                                    <TableCell className="font-medium">{item.product_name}</TableCell>
                                                    <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">₹{item.unit_price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{item.tax_percent}%</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">₹{item.tax_amount.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-bold text-primary">₹{item.total_amount.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(index)}
                                                            className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-10 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                                    No items added to invoice. Start by selecting an SKU above.
                                </div>
                            )}

                            {items.length > 0 && (
                                <div className="flex justify-end pt-4 border-t">
                                    <div className="w-80 space-y-3 p-4 bg-muted/20 rounded-lg">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Gross Amount</span>
                                            <span className="font-medium text-foreground">₹{totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Discount</span>
                                            <span className="font-medium text-destructive">-₹{totals.discount.toFixed(2)}</span>
                                        </div>
                                        {form.watch('is_gst_invoice') ? (
                                            <>
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Output CGST</span>
                                                    <span className="font-medium text-foreground">₹{(totals.tax / 2).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Output SGST</span>
                                                    <span className="font-medium text-foreground">₹{(totals.tax / 2).toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Output IGST</span>
                                                <span className="font-medium text-foreground">₹{totals.tax.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Shipping/Freight</span>
                                            <span className="font-medium text-foreground">₹{transportCharges.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-xl pt-2 border-t border-muted text-primary">
                                            <span>Grand Total</span>
                                            <span>₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Notes & Remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea {...field} className="min-h-[80px]" placeholder="Add any specific delivery instructions or invoice notes..." />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 pb-10">
                        <Button type="button" variant="outline" size="lg" onClick={() => navigate('/sales')} className="px-10">
                            Discard
                        </Button>
                        <Button type="submit" size="lg" disabled={items.length === 0 || createSale.isPending || updateSale.isPending} className="px-10 shadow-lg shadow-primary/20">
                            {(createSale.isPending || updateSale.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? 'Save Changes' : 'Generate & Save Invoice'}
                        </Button>
                    </div>
                </form>
            </Form>
        </PageContainer>
    );
}
