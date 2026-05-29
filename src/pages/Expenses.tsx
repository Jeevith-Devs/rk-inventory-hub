import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePurchases } from '@/hooks/usePurchases';
import { useSales } from '@/hooks/useSales';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportFinancialYearToExcel } from '@/lib/excelExport';

interface OtherExpense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
}

const CATEGORIES = [
  'Rent',
  'Salary',
  'Utilities (Electricity/Water/Internet)',
  'Transport & Logistics',
  'Office Supplies',
  'Tea & Snacking',
  'Taxes & Duties',
  'Miscellaneous',
];

const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT / Bank Transfer', 'Credit Card', 'Cheque'];

export default function Expenses() {
  const { toast } = useToast();
  const { data: purchases, isLoading: isLoadingPurchases } = usePurchases();
  const { data: sales, isLoading: isLoadingSales } = useSales();

  // Date Filters (Default: start and end of current month)
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Table Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Other Expenses state (stored in localStorage)
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedFY, setSelectedFY] = useState('FY 2026-27');

  // New expense form fields
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaymentMode, setExpensePaymentMode] = useState('Cash');

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('rk_other_expenses');
    if (stored) {
      try {
        setOtherExpenses(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse other expenses from localStorage', e);
      }
    }
  }, []);

  // Save to localStorage helper
  const saveExpenses = (updated: OtherExpense[]) => {
    setOtherExpenses(updated);
    localStorage.setItem('rk_other_expenses', JSON.stringify(updated));
  };

  // Add a new expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!expenseDate || !expenseCategory || !expenseDescription || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill out all fields with valid information.',
        variant: 'destructive',
      });
      return;
    }

    const newExpense: OtherExpense = {
      id: crypto.randomUUID(),
      date: expenseDate,
      category: expenseCategory,
      description: expenseDescription,
      amount: amountNum,
      paymentMode: expensePaymentMode,
    };

    const updated = [newExpense, ...otherExpenses];
    saveExpenses(updated);
    setIsDialogOpen(false);

    // Reset Form
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    setExpenseCategory('');
    setExpenseDescription('');
    setExpenseAmount('');
    setExpensePaymentMode('Cash');

    toast({
      title: 'Expense Added',
      description: 'The expense has been successfully logged.',
    });
  };

  // Delete an expense
  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updated = otherExpenses.filter((exp) => exp.id !== id);
      saveExpenses(updated);
      toast({
        title: 'Expense Deleted',
        description: 'The expense entry has been removed.',
      });
    }
  };

  // Export Excel for Financial Year
  const handleExportExcel = () => {
    let startStr = '';
    let endStr = '';
    switch (selectedFY) {
      case 'FY 2026-27':
        startStr = '2026-04-01';
        endStr = '2027-03-31';
        break;
      case 'FY 2025-26':
        startStr = '2025-04-01';
        endStr = '2026-03-31';
        break;
      case 'FY 2024-25':
        startStr = '2024-04-01';
        endStr = '2025-03-31';
        break;
    }
    
    exportFinancialYearToExcel(
      selectedFY,
      startStr,
      endStr,
      sales || [],
      purchases || [],
      otherExpenses
    );
    
    setIsExportDialogOpen(false);
    toast({
      title: 'Excel Exported',
      description: `Successfully exported report for ${selectedFY}.`,
    });
  };

  // ─── Data Aggregation ──────────────────────────────────────────────────

  // Filter Stock In (Purchases) by date range
  const filteredPurchases = (purchases || []).filter((p) =>
    isWithinInterval(parseISO(p.purchase_date), {
      start: parseISO(startDate),
      end: parseISO(endDate),
    })
  );

  // Filter Stock Out (Sales) by date range
  const filteredSales = (sales || []).filter((s) =>
    isWithinInterval(parseISO(s.sale_date), {
      start: parseISO(startDate),
      end: parseISO(endDate),
    })
  );

  // Filter Other Expenses by date range
  const filteredOtherExpenses = otherExpenses.filter((exp) =>
    isWithinInterval(parseISO(exp.date), {
      start: parseISO(startDate),
      end: parseISO(endDate),
    })
  );

  // Totals calculations
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalOther = filteredOtherExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netBalance = totalSales - totalPurchases - totalOther;

  // ─── Combined Chronological Ledger ──────────────────────────────────────

  interface LedgerEntry {
    id: string;
    date: string;
    type: 'purchase' | 'sale' | 'other';
    reference: string;
    description: string;
    category: string;
    paymentMode: string;
    amount: number; // Positive for Income, Negative for Expense
  }

  const ledgerEntries: LedgerEntry[] = [
    ...filteredSales.map((s) => ({
      id: s.id,
      date: s.sale_date,
      type: 'sale' as const,
      reference: s.invoice_number,
      description: `Stock Out / Sale to ${s.buyers?.company_name || 'Customer'}`,
      category: 'Inventory Sale',
      paymentMode: s.payment_mode || 'Credit',
      amount: s.grand_total || 0,
    })),
    ...filteredPurchases.map((p) => ({
      id: p.id,
      date: p.purchase_date,
      type: 'purchase' as const,
      reference: p.purchase_number,
      description: `Stock In / Purchase from ${p.suppliers?.company_name || 'Supplier'}`,
      category: 'Inventory Purchase',
      paymentMode: 'Credit', // Supabase purchases schema doesn't store mode directly
      amount: -(p.total_amount || 0),
    })),
    ...filteredOtherExpenses.map((exp) => ({
      id: exp.id,
      date: exp.date,
      type: 'other' as const,
      reference: 'EXP-' + exp.id.slice(0, 4).toUpperCase(),
      description: exp.description,
      category: exp.category,
      paymentMode: exp.paymentMode,
      amount: -exp.amount,
    })),
  ];

  // Sort by date (descending)
  const sortedLedger = ledgerEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((entry) => {
      // Filter by Type
      if (filterType !== 'all' && entry.type !== filterType) return false;
      // Filter by Category
      if (filterCategory !== 'all' && entry.category !== filterCategory) return false;
      return true;
    });

  const isLoading = isLoadingPurchases || isLoadingSales;

  return (
    <PageContainer
      title="Expense & Profit Calculator"
      actions={
        <div className="flex gap-2">
          {/* Export Financial Year Dialog */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export FY Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Export Financial Year Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Financial Year
                  </label>
                  <Select value={selectedFY} onValueChange={setSelectedFY}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FY 2026-27">FY 2026-27 (Apr 2026 - Mar 2027)</SelectItem>
                      <SelectItem value="FY 2025-26">FY 2025-26 (Apr 2025 - Mar 2026)</SelectItem>
                      <SelectItem value="FY 2024-25">FY 2024-25 (Apr 2024 - Mar 2025)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will generate an Excel spreadsheet containing a detailed financial summary and a chronological transaction ledger for the selected Indian Financial Year.
                </p>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExportExcel} className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    Download Excel
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Expense Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Other Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Log Custom Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date *</label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category *</label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (₹) *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Mode</label>
                  <Select value={expensePaymentMode} onValueChange={setExpensePaymentMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description / Note *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Office rent payment for May"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    required
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Log Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Date Filter Row */}
      <div className="flex flex-wrap gap-4 mb-6 items-end p-4 bg-card rounded-lg border">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">From Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">To Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="text-xs text-muted-foreground self-center mt-4">
          Calculated dynamically for selected dates.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Total Revenue (Sales)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ₹{totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredSales.length} Stock Out invoices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/40 dark:bg-rose-950/10 border-rose-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-300">
              Stock In Expenses
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              ₹{totalPurchases.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredPurchases.length} purchase orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Other Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              ₹{totalOther.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredOtherExpenses.length} manual logs
            </p>
          </CardContent>
        </Card>

        <Card className={netBalance >= 0 
          ? "bg-primary/5 border-primary/20" 
          : "bg-red-50/40 border-red-200"
        }>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${netBalance >= 0 ? 'text-primary' : 'text-red-800'}`}>
              Net Margin (P&L)
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${netBalance >= 0 ? 'text-primary' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{netBalance.toLocaleString()}
            </div>
            <div className="mt-1">
              <Badge variant={netBalance >= 0 ? 'default' : 'destructive'} className="text-[10px] py-0 px-2">
                {totalSales > 0 ? ((netBalance / totalSales) * 100).toFixed(1) : '0.0'}% Net Profit Margin
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Unified Cash flow & Ledger</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              A breakdown of Stock In, Stock Out, and other logged expenditures.
            </p>
          </div>
          {/* Table Filters */}
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Stock Out (Sale)</SelectItem>
                <SelectItem value="purchase">Stock In (Purchase)</SelectItem>
                <SelectItem value="other">Other Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Inventory Sale">Inventory Sale</SelectItem>
                <SelectItem value="Inventory Purchase">Inventory Purchase</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading ledger transactions...</div>
          ) : sortedLedger.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions match the selected dates/filters.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead className="w-32">Type</TableHead>
                    <TableHead className="w-36">Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-48">Category</TableHead>
                    <TableHead className="w-36">Payment Mode</TableHead>
                    <TableHead className="text-right w-36">Amount</TableHead>
                    <TableHead className="w-16 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLedger.map((entry) => {
                    const isIncome = entry.amount > 0;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(parseISO(entry.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.type === 'sale'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : entry.type === 'purchase'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }
                          >
                            {entry.type === 'sale'
                              ? 'Stock Out'
                              : entry.type === 'purchase'
                              ? 'Stock In'
                              : 'Other Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {entry.reference}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={entry.description}>
                          {entry.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{entry.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{entry.paymentMode}</TableCell>
                        <TableCell className={`text-right font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}₹{Math.abs(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.type === 'other' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-600"
                              onClick={() => handleDeleteExpense(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
