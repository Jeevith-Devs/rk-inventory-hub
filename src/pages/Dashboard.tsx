import { 
  Package, 
  Users, 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  IndianRupee
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDashboardStats } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  variant = 'default'
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: 'up' | 'down';
  variant?: 'default' | 'warning' | 'success';
}) {
  const bgColors = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bgColors[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <PageContainer title="Dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            description="Active products in inventory"
          />
          <StatCard
            title="Total Suppliers"
            value={stats?.totalSuppliers || 0}
            icon={Truck}
            description="Active suppliers"
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalBuyers || 0}
            icon={Users}
            description="Active customers"
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockCount || 0}
            icon={AlertTriangle}
            description="Below reorder level"
            variant={stats?.lowStockCount && stats.lowStockCount > 0 ? 'warning' : 'default'}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Stock Value"
            value={formatCurrency(stats?.totalStockValue || 0)}
            icon={IndianRupee}
            description="Total inventory value"
            variant="success"
          />
          <StatCard
            title="Monthly Purchases"
            value={formatCurrency(stats?.monthlyPurchases || 0)}
            icon={TrendingUp}
            description="This month"
          />
          <StatCard
            title="Monthly Sales"
            value={formatCurrency(stats?.monthlySales || 0)}
            icon={TrendingDown}
            description="This month"
            variant="success"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Purchases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Purchases</CardTitle>
              <CardDescription>Latest stock-in entries</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPurchases.map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{purchase.purchase_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {purchase.suppliers?.company_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(purchase.total_amount || 0)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent purchases
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sales</CardTitle>
              <CardDescription>Latest invoices generated</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{sale.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.buyers?.company_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-success">{formatCurrency(sale.grand_total || 0)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent sales
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
