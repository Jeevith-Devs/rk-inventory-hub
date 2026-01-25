import { useState } from 'react';
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
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

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
    const { data: existingQuotation } = useQuotation(id || '');
    const createQuotation = useCreateQuotation();
    const updateQuotation = useUpdateQuotation();

    const [buyerId, setBuyerId] = useState('');
    const [quotationDate, setQuotationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    const [referenceNo, setReferenceNo] = useState('');
    const [isGst, setIsGst] = useState(true);
    const [notes, setNotes] = useState('');
    const [termsConditions, setTermsConditions] = useState('');
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b p-3 sm:p-4 flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    onClick={() => navigate('/quotations')}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    Back to Quotations
                </Button>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-6 md:p-8">
                <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
                    <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit' : 'Create New'} Quotation</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium">Customer *</label>
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
                                <label className="text-sm font-medium">Quotation Date *</label>
                                <Input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Valid Until *</label>
                                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Reference No</label>
                                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={isGst} onCheckedChange={setIsGst} />
                            <label className="text-sm font-medium">GST Quotation</label>
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
                                            {products?.filter((p) => p.status === 'active').map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.name} - ₹{product.selling_price}
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
                                        onChange={(e) => setQuantity(e.target.value)}
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
                                    {isGst ? (
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
                                    <div className="flex justify-between font-bold border-t pt-2">
                                        <span>Grand Total:</span>
                                        <span>₹{totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes and Terms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Notes</label>
                                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Terms & Conditions</label>
                                <Textarea value={termsConditions} onChange={(e) => setTermsConditions(e.target.value)} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={items.length === 0 || !buyerId || createQuotation.isPending || updateQuotation.isPending}
                            >
                                {(createQuotation.isPending || updateQuotation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditMode ? 'Update Quotation' : 'Create Quotation'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
