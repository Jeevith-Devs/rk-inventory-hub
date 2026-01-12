import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id: string;
  purchase_date: string;
  invoice_number: string | null;
  invoice_date: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  notes: string | null;
  bill_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
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

export interface PurchaseWithItems extends Purchase {
  suppliers?: { company_name: string };
  purchase_items?: (PurchaseItem & { products?: { name: string; product_code: string } })[];
}

export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, suppliers(company_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseWithItems[];
    },
  });
};

export const usePurchase = (id: string) => {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, suppliers(*), purchase_items(*, products(*))')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as PurchaseWithItems | null;
    },
    enabled: !!id,
  });
};

interface CreatePurchaseInput {
  purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>;
  items: Omit<PurchaseItem, 'id' | 'purchase_id' | 'created_at'>[];
}

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ purchase, items }: CreatePurchaseInput) => {
      // Create purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchase)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const itemsWithPurchaseId = items.map(item => ({
        ...item,
        purchase_id: purchaseData.id,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsWithPurchaseId);

      if (itemsError) throw itemsError;

      return purchaseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Purchase created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating purchase', description: error.message, variant: 'destructive' });
    },
  });
};
