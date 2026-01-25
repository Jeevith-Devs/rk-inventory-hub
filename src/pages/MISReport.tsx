import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useSales, useUpdateSalePayment } from '@/hooks/useSales';
import { usePurchases, useUpdatePurchasePayment } from '@/hooks/usePurchases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Pencil,
    CreditCard
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

export default function MISReport() {
    const { data: sales, isLoading: salesLoading } = useSales();
    const { data: purchases, isLoading: purchasesLoading } = usePurchases();
    const updateSalePayment = useUpdateSalePayment();
    const updatePurchasePayment = useUpdatePurchasePayment();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editType, setEditType] = useState<'sale' | 'purchase' | null>(null);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [paymentStatus, setPaymentStatus] = useState<string>('Unpaid');
    const [paymentReference, setPaymentReference] = useState<string>('');

    // Calculations
    const totalReceivable = sales?.reduce((acc, s) => acc + (s.grand_total || 0) - (s.paid_amount || 0), 0) || 0;
    const totalPayable = purchases?.reduce((acc, p) => acc + (p.total_amount || 0) - (p.paid_amount || 0), 0) || 0;

    const overdueSales = sales?.filter(s => s.payment_status !== 'Paid' && s.due_date && isAfter(new Date(), parseISO(s.due_date))).length || 0;
    const overduePurchases = purchases?.filter(p => p.payment_status !== 'Paid' && p.due_date && isAfter(new Date(), parseISO(p.due_date))).length || 0;

    const handleUpdatePayment = () => {
        if (!selectedItem || !editType) return;

        if (editType === 'sale') {
            updateSalePayment.mutate({
                id: selectedItem.id,
                paid_amount: Number(paidAmount),
                payment_status: paymentStatus as any,
                payment_reference: paymentReference
            }, {
                onSuccess: () => setSelectedItem(null)
            });
        } else {
            updatePurchasePayment.mutate({
                id: selectedItem.id,
                paid_amount: Number(paidAmount),
                payment_status: paymentStatus as any,
                payment_reference: paymentReference
            }, {
                onSuccess: () => setSelectedItem(null)
            });
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'Paid': return 'bg-success/10 text-success border-success/20';
            case 'Partial': return 'bg-warning/10 text-warning border-warning/20';
            case 'Overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const filterData = (data: any[]) => {
        return data?.filter(item =>
            (item.invoice_number || item.purchase_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.buyers?.company_name || item.suppliers?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.payment_reference || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    return (
        <PageContainer title="MIS Report (Payment Status)">
            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Receivables (Sales)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" />
                                {totalReceivable.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Outstanding from customers</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background border-rose-100 dark:border-rose-900/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Total Payables (Purchase)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" />
                                {totalPayable.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Pending to suppliers</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600">Overdue Sales Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{overdueSales}</div>
                            <p className="text-xs text-muted-foreground mt-1">Past due date</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600">Overdue Purchases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{overduePurchases}</div>
                            <p className="text-xs text-muted-foreground mt-1">Past due date</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Payment Tracking</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search party, ref or txn..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="receivables" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="receivables">Receivables (Sales)</TabsTrigger>
                                <TabsTrigger value="payables">Payables (Purchases)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="receivables">
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Invoice #</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead>Reference/Txn</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filterData(sales || [])?.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell className="font-medium font-mono text-xs">{sale.invoice_number}</TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{sale.buyers?.company_name}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className={isAfter(new Date(), parseISO(sale.due_date || '')) && sale.payment_status !== 'Paid' ? 'text-destructive font-bold' : ''}>
                                                            {sale.due_date ? format(new Date(sale.due_date), 'dd MMM yy') : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-xs">₹{(sale.grand_total || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-bold text-xs">₹{((sale.grand_total || 0) - (sale.paid_amount || 0)).toLocaleString()}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                        {sale.payment_reference || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getStatusColor(sale.payment_status)}>
                                                            {sale.payment_status || 'Unpaid'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => {
                                                                setSelectedItem(sale);
                                                                setEditType('sale');
                                                                setPaidAmount(sale.paid_amount || 0);
                                                                setPaymentStatus(sale.payment_status || 'Unpaid');
                                                                setPaymentReference(sale.payment_reference || '');
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="payables">
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Purchase #</TableHead>
                                                <TableHead>Supplier</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead>Reference/Txn</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filterData(purchases || [])?.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium font-mono text-xs">{p.purchase_number}</TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{p.suppliers?.company_name}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className={isAfter(new Date(), parseISO(p.due_date || '')) && p.payment_status !== 'Paid' ? 'text-destructive font-bold' : ''}>
                                                            {p.due_date ? format(new Date(p.due_date), 'dd MMM yy') : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-xs">₹{(p.total_amount || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-bold text-xs">₹{((p.total_amount || 0) - (p.paid_amount || 0)).toLocaleString()}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                        {p.payment_reference || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getStatusColor(p.payment_status)}>
                                                            {p.payment_status || 'Unpaid'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => {
                                                                setSelectedItem(p);
                                                                setEditType('purchase');
                                                                setPaidAmount(p.paid_amount || 0);
                                                                setPaymentStatus(p.payment_status || 'Unpaid');
                                                                setPaymentReference(p.payment_reference || '');
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Update Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Payment Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-muted rounded-md text-center border">
                                <p className="text-muted-foreground mb-1 text-xs">Total Bill Value</p>
                                <p className="font-bold text-lg">₹{(selectedItem?.grand_total || selectedItem?.total_amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-primary/5 rounded-md text-center border border-primary/20">
                                <p className="text-muted-foreground mb-1 text-xs">Current Balance</p>
                                <p className="font-bold text-lg text-primary">₹{((selectedItem?.grand_total || selectedItem?.total_amount || 0) - (selectedItem?.paid_amount || 0)).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Paid Amount (₹)</label>
                            <Input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(Number(e.target.value))}
                                placeholder="Enter amount received"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Transaction / Cheque Details</label>
                            <div className="relative">
                                <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="e.g. UPI ID, Cheque No, Bank Ref"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Status</label>
                            <Tabs value={paymentStatus} onValueChange={setPaymentStatus} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="Unpaid">Unpaid</TabsTrigger>
                                    <TabsTrigger value="Partial">Partial</TabsTrigger>
                                    <TabsTrigger value="Paid">Paid</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
                        <Button onClick={handleUpdatePayment}>Save Verification</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
