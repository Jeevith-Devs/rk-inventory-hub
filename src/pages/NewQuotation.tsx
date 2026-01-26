import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateQuotation, useQuotation, useUpdateQuotation } from '@/hooks/useQuotations';
import { useBuyers } from '@/hooks/useBuyers';
import { useProducts } from '@/hooks/useProducts';
import { useNextQuotationNumber } from '@/hooks/useInvoiceSequence';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Loader2, UserPlus, PackagePlus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { BuyerForm } from '@/components/forms/BuyerForm';
import { ProductForm } from '@/components/forms/ProductForm';
import { useCreateBuyer } from '@/hooks/useBuyers';
import { useCreateProduct } from '@/hooks/useProducts';
import { format, addDays } from 'date-fns';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuotationItem {
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

export function QuotationFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;

    const { data: buyers } = useBuyers();
    const { data: products } = useProducts();
    const { data: quotationNumber } = useNextQuotationNumber();
    const { data: existingQuotation, isLoading: isLoadingQuotation } = useQuotation(id || '');
    const createQuotation = useCreateQuotation();
    const updateQuotation = useUpdateQuotation();

    const [buyerId, setBuyerId] = useState('');
    const [quotationDate, setQuotationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    const [referenceNo, setReferenceNo] = useState('');
    const [isGst, setIsGst] = useState(true);
    const [notes, setNotes] = useState('');
    const [termsConditions, setTermsConditions] = useState(`1. Validity: 30 days from the date of quotation.
2. Delivery: Within 3-7 days after receipt of confirmed PO.
3. Payment: Within 30 days from date of invoice.
4. GST: Extra as applicable at the time of supply.
5. F.O.R: Destination / Ex-works as agreed.`);
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');

    const [showNewBuyerDialog, setShowNewBuyerDialog] = useState(false);
    const [showNewProductDialog, setShowNewProductDialog] = useState(false);

    const createBuyer = useCreateBuyer();
    const createProduct = useCreateProduct();

    useEffect(() => {
        if (isEditMode && existingQuotation) {
            setBuyerId(existingQuotation.buyer_id);
            setQuotationDate(existingQuotation.quotation_date);
            setValidUntil(existingQuotation.valid_until);
            setReferenceNo(existingQuotation.reference_no || '');
            setIsGst(existingQuotation.is_gst_quotation ?? true);
            setNotes(existingQuotation.notes || '');
            setTermsConditions(existingQuotation.terms_conditions || '');

            if (existingQuotation.quotation_items) {
                const mappedItems = existingQuotation.quotation_items.map((item: any) => ({
                    product_id: item.product_id,
                    product_name: item.products?.name || 'Unknown Product',
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    tax_percent: Number(item.tax_percent || 0),
                    discount_percent: Number(item.discount_percent || 0),
                    tax_amount: Number(item.tax_amount || 0),
                    discount_amount: Number(item.discount_amount || 0),
                    total_amount: Number(item.total_amount || 0),
                }));
                setItems(mappedItems);
            }
        }
    }, [isEditMode, existingQuotation]);

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

        const newItem: QuotationItem = {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !buyerId) return;

        const halfTax = totals.tax / 2;

        const quotationData = {
            quotation_number: isEditMode ? existingQuotation!.quotation_number : quotationNumber!,
            buyer_id: buyerId,
            quotation_date: quotationDate,
            valid_until: validUntil,
            reference_no: referenceNo || null,
            status: 'Draft' as const,
            subtotal: totals.subtotal,
            discount_amount: totals.discount,
            cgst_amount: isGst ? halfTax : 0,
            sgst_amount: isGst ? halfTax : 0,
            igst_amount: isGst ? 0 : totals.tax,
            total_amount: totals.total,
            round_off: 0,
            grand_total: totals.total,
            notes: notes || null,
            terms_conditions: termsConditions || null,
            is_gst_quotation: isGst,
            created_by: user?.id || null,
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
            updateQuotation.mutate(
                { quotationId: id!, quotation: quotationData, items: itemsData },
                { onSuccess: () => navigate('/quotations') }
            );
        } else {
            if (!quotationNumber) {
                alert('Generating quotation number, please wait...');
                return;
            }
            createQuotation.mutate(
                { quotation: quotationData, items: itemsData },
                { onSuccess: () => navigate('/quotations') }
            );
        }
    };

    if (isEditMode && isLoadingQuotation) {
        return (
            <PageContainer title="Edit Quotation">
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title={isEditMode ? `Edit Quotation: ${existingQuotation?.quotation_number}` : 'Generate New Quotation'}
            actions={
                <Button variant="outline" size="sm" onClick={() => navigate('/quotations')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                </Button>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Customer & Period</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium">Customer *</label>
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
                                                    setBuyerId(newBuyer.id);
                                                    setShowNewBuyerDialog(false);
                                                }
                                            })}
                                            onCancel={() => setShowNewBuyerDialog(false)}
                                            isLoading={createBuyer.isPending}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Select value={buyerId} onValueChange={setBuyerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {buyers?.filter((b) => b.is_active).map((buyer) => (
                                        <SelectItem key={buyer.id} value={buyer.id}>
                                            {buyer.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block pt-[26px]">Quotation Date *</label>
                            <Input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block pt-[26px]">Valid Until *</label>
                            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block pt-[26px]">Reference No</label>
                            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. Inquiry #123" />
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                            <Switch checked={isGst} onCheckedChange={setIsGst} />
                            <label className="text-xs font-semibold uppercase tracking-widest text-primary">GST Quotation</label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-sm font-medium">Line Items</CardTitle>
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
                                <label className="text-xs font-semibold mb-1 block uppercase tracking-wider text-muted-foreground">Select Product</label>
                                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Search item to quote..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products?.filter((p) => p.status === 'active').map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} - ₹{product.selling_price}
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
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                            <Button type="button" onClick={addItem} disabled={!selectedProduct || !quantity} className="h-10 px-6">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        </div>

                        {items.length > 0 ? (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="py-3">Description</TableHead>
                                            <TableHead className="text-right py-3">Qty</TableHead>
                                            <TableHead className="text-right py-3">Rate</TableHead>
                                            <TableHead className="text-right py-3">Tax %</TableHead>
                                            <TableHead className="text-right py-3 font-semibold">Total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index} className="hover:bg-muted/20">
                                                <TableCell className="font-medium">{item.product_name}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.unit_price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{item.tax_percent}%</TableCell>
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
                                No items added. Choose a product above to build your quotation.
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className="flex justify-end pt-4 border-t">
                                <div className="w-full sm:w-80 space-y-3 p-4 bg-muted/20 rounded-lg">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-foreground">₹{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Discount</span>
                                        <span className="font-medium text-destructive">-₹{totals.discount.toFixed(2)}</span>
                                    </div>
                                    {isGst ? (
                                        <>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Estimated CGST</span>
                                                <span className="font-medium text-foreground">₹{(totals.tax / 2).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Estimated SGST</span>
                                                <span className="font-medium text-foreground">₹{(totals.tax / 2).toFixed(2)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Estimated IGST</span>
                                            <span className="font-medium text-foreground">₹{totals.tax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-xl pt-2 border-t border-muted text-primary">
                                        <span>Quotation Total</span>
                                        <span>₹{totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Notes & Remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                                placeholder="Internal notes or specific remarks..."
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Terms & Conditions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={termsConditions}
                                onChange={(e) => setTermsConditions(e.target.value)}
                                className="min-h-[100px]"
                                placeholder="Standard terms for the customer..."
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pb-10">
                    <Button type="button" variant="outline" size="lg" onClick={() => navigate('/quotations')} className="w-full sm:w-auto px-10">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        disabled={items.length === 0 || !buyerId || createQuotation.isPending || updateQuotation.isPending}
                        className="w-full sm:w-auto px-10 shadow-lg shadow-primary/20"
                    >
                        {(createQuotation.isPending || updateQuotation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditMode ? 'Update Quotation' : 'Save & Generate Quotation'}
                    </Button>
                </div>
            </form>
        </PageContainer>
    );
}
