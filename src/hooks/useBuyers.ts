import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Buyer {
  id: string;
  buyer_code: string;
  company_name: string;
  contact_person: string | null;
  billing_address: string | null;
  delivery_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gst_no: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export type BuyerInput = Omit<Buyer, 'id' | 'created_at' | 'updated_at'>;

export const useBuyers = () => {
  return useQuery({
    queryKey: ['buyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .order('company_name');

      if (error) throw error;
      return data as Buyer[];
    },
  });
};

export const useBuyer = (id: string) => {
  return useQuery({
    queryKey: ['buyers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Buyer | null;
    },
    enabled: !!id,
  });
};

export const useCreateBuyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buyer: BuyerInput) => {
      const { data, error } = await supabase
        .from('buyers')
        .insert(buyer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast({ title: 'Customer created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating customer', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateBuyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...buyer }: Partial<Buyer> & { id: string }) => {
      const { data, error } = await supabase
        .from('buyers')
        .update(buyer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast({ title: 'Customer updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating customer', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteBuyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('buyers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast({ title: 'Customer deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting customer', description: error.message, variant: 'destructive' });
    },
  });
};
