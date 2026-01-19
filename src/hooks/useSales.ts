import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PaymentMode = 'Cash' | 'UPI' | 'NEFT' | 'Credit' | 'Cheque';
export type TransportMode = 'Road' | 'Courier' | 'Pickup' | 'Rail' | 'Air';

export interface Sale {
  id: string;
  invoice_number: string;
  buyer_id: string;
  sale_date: string;
  dispatch_date: string | null;
  vehicle_no: string | null;
  lr_no: string | null;
  purchase_order_no: string | null;
  purchase_order_date: string | null;
  transport_mode: TransportMode | null;
  transport_charges: number | null;
  payment_mode: PaymentMode | null;
  subtotal: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  round_off: number | null;
  grand_total: number | null;
  notes: string | null;
  is_gst_invoice: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_percent: number | null;
  tax_amount: number | null;
  discount_percent: number | null;
  discount_amount: number | null;
  total_amount: number;
  created_at: string;
}

export interface SaleWithItems extends Sale {
  buyers?: { 
    company_name: string;
    billing_address: string | null;
    delivery_address: string | null;
    gst_no: string | null;
    contact_person: string | null;
    phone: string | null;
  };
  sale_items?: (SaleItem & { products?: { name: string; product_code: string; hsn_code: string | null; unit: string | null } })[];
}

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, buyers(company_name), sale_items(*, products(name, product_code))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SaleWithItems[];
    },
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, buyers(*), sale_items(*, products(*))')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as SaleWithItems | null;
    },
    enabled: !!id,
  });
};

interface CreateSaleInput {
  sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
  items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[];
}

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sale, items }: CreateSaleInput) => {
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const itemsWithSaleId = items.map(item => ({
        ...item,
        sale_id: saleData.id,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId);

      if (itemsError) throw itemsError;

      return saleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sale created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating sale', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete sale items first
      await supabase.from('sale_items').delete().eq('sale_id', id);
      // Then delete the sale
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sale deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting sale', description: error.message, variant: 'destructive' });
    },
  });
};
