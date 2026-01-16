import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePurchases } from '@/hooks/usePurchases';
import { useSales } from '@/hooks/useSales';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useBuyers } from '@/hooks/useBuyers';
import { useProducts } from '@/hooks/useProducts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Download, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: purchases } = usePurchases();
  const { data: sales } = useSales();
  const { data: products } = useProducts();
  const { data: suppliers } = useSuppliers();
  const { data: buyers } = useBuyers();

  const filteredPurchases = purchases?.filter((p) =>
    isWithinInterval(parseISO(p.purchase_date), {
      start: parseISO(startDate),
      end: parseISO(endDate),
    })
  );

  const filteredSales = sales?.filter((s) =>
    isWithinInterval(parseISO(s.sale_date), {
      start: parseISO(startDate),
      end: parseISO(endDate),
    })
  );

  const totalPurchases = filteredPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  const totalSales = filteredSales?.reduce((sum, s) => sum + (s.grand_total || 0), 0) || 0;
  const profit = totalSales - totalPurchases;

  const lowStockProducts = products?.filter(
    (p) => (p.current_stock || 0) <= (p.reorder_level || 0) && p.status === 'active'
  );

  const getSupplierName = (id: string) => suppliers?.find((s) => s.id === id)?.company_name || '-';
  const getBuyerName = (id: string) => buyers?.find((b) => b.id === id)?.company_name || '-';

  return (
    <PageContainer title="Reports">
      {/* Date Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-sm font-medium">From Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-sm font-medium">To Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPurchases?.length || 0} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredSales?.length || 0} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className={`h-4 w-4 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Purchases Report</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases?.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(parseISO(purchase.purchase_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-mono">{purchase.purchase_number}</TableCell>
                        <TableCell>{getSupplierName(purchase.supplier_id)}</TableCell>
                        <TableCell>{purchase.invoice_number || '-'}</TableCell>
                        <TableCell className="text-right">
                          ₹{purchase.total_amount?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredPurchases || filteredPurchases.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No purchases in this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales?.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{format(parseISO(sale.sale_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-mono">{sale.invoice_number}</TableCell>
                        <TableCell>{getBuyerName(sale.buyer_id)}</TableCell>
                        <TableCell>{sale.payment_mode}</TableCell>
                        <TableCell className="text-right">
                          ₹{sale.grand_total?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredSales || filteredSales.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No sales in this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Stock Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => {
                      const isLowStock = (product.current_stock || 0) <= (product.reorder_level || 0);
                      const stockValue = (product.current_stock || 0) * (product.purchase_price || 0);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono">{product.product_code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell className={`text-right ${isLowStock ? 'text-red-600 font-medium' : ''}`}>
                            {product.current_stock}
                          </TableCell>
                          <TableCell className="text-right">{product.reorder_level}</TableCell>
                          <TableCell className="text-right">₹{product.purchase_price}</TableCell>
                          <TableCell className="text-right">₹{stockValue.toLocaleString()}</TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <span className="text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="text-green-600">OK</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
