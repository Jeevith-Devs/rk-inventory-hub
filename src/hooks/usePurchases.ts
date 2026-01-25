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
  payment_status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue' | null;
  paid_amount: number | null;
  due_date: string | null;
  payment_reference: string | null;
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

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, purchase, items }: CreatePurchaseInput & { id: string }) => {
      // Update purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .update(purchase)
        .eq('id', id)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Update purchase items (delete and re-insert for simplicity)
      await supabase.from('purchase_items').delete().eq('purchase_id', id);

      const itemsWithPurchaseId = items.map(item => ({
        ...item,
        purchase_id: id,
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
      toast({ title: 'Purchase updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating purchase', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdatePurchasePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paid_amount, payment_status, payment_reference }: { id: string; paid_amount: number; payment_status: any; payment_reference?: string | null }) => {
      const { data, error } = await supabase
        .from('purchases')
        .update({ paid_amount, payment_status, payment_reference })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Payment updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating payment', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete purchase items first
      await supabase.from('purchase_items').delete().eq('purchase_id', id);
      // Then delete the purchase
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Purchase deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting purchase', description: error.message, variant: 'destructive' });
    },
  });
};
