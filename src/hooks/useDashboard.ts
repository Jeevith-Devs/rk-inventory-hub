import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalProducts: number;
  totalSuppliers: number;
  totalBuyers: number;
  totalStockValue: number;
  lowStockCount: number;
  monthlyPurchases: number;
  monthlySales: number;
  recentPurchases: any[];
  recentSales: any[];
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get counts
      const [
        { count: totalProducts },
        { count: totalSuppliers },
        { count: totalBuyers },
        { data: products },
        { data: lowStockProducts },
        { data: monthlyPurchasesData },
        { data: monthlySalesData },
        { data: recentPurchases },
        { data: recentSales },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('buyers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('current_stock, purchase_price').eq('status', 'active'),
        supabase.from('products').select('*').lte('current_stock', supabase.rpc).eq('status', 'active'),
        supabase.from('purchases').select('total_amount').gte('created_at', startOfMonth),
        supabase.from('sales').select('grand_total').gte('created_at', startOfMonth),
        supabase.from('purchases').select('*, suppliers(company_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('sales').select('*, buyers(company_name)').order('created_at', { ascending: false }).limit(5),
      ]);

      // Calculate total stock value
      const totalStockValue = products?.reduce((acc, p) => {
        return acc + ((p.current_stock || 0) * (p.purchase_price || 0));
      }, 0) || 0;

      // Calculate monthly totals
      const monthlyPurchases = monthlyPurchasesData?.reduce((acc, p) => acc + (p.total_amount || 0), 0) || 0;
      const monthlySales = monthlySalesData?.reduce((acc, s) => acc + (s.grand_total || 0), 0) || 0;

      // Count low stock products
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .filter('current_stock', 'lte', 'reorder_level');

      return {
        totalProducts: totalProducts || 0,
        totalSuppliers: totalSuppliers || 0,
        totalBuyers: totalBuyers || 0,
        totalStockValue,
        lowStockCount: lowStockCount || 0,
        monthlyPurchases,
        monthlySales,
        recentPurchases: recentPurchases || [],
        recentSales: recentSales || [],
      };
    },
  });
};

export const useCompanySettings = () => {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: any) => {
      const { data, error } = await supabase
        .from('company_settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });
};
