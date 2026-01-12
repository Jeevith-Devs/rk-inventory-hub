import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_person: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gst_no: string | null;
  pan_no: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export type SupplierInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name');

      if (error) throw error;
      return data as Supplier[];
    },
  });
};

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Supplier | null;
    },
    enabled: !!id,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: SupplierInput) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating supplier', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating supplier', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting supplier', description: error.message, variant: 'destructive' });
    },
  });
};
