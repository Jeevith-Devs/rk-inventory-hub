import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface Quotation {
    id: string;
    quotation_number: string;
    buyer_id: string;
    quotation_date: string;
    valid_until: string;
    reference_no: string | null;
    status: QuotationStatus;
    subtotal: number | null;
    cgst_amount: number | null;
    sgst_amount: number | null;
    igst_amount: number | null;
    discount_amount: number | null;
    total_amount: number | null;
    round_off: number | null;
    grand_total: number | null;
    notes: string | null;
    terms_conditions: string | null;
    is_gst_quotation: boolean | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface QuotationItem {
    id: string;
    quotation_id: string;
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

export interface QuotationWithItems extends Quotation {
    buyers?: {
        company_name: string;
        billing_address: string | null;
        delivery_address: string | null;
        gst_no: string | null;
        contact_person: string | null;
        phone: string | null;
    };
    quotation_items?: (QuotationItem & { products?: { name: string; product_code: string; hsn_code: string | null; unit: string | null } })[];
}

export const useQuotations = () => {
    return useQuery({
        queryKey: ['quotations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('quotations')
                .select('*, buyers(company_name), quotation_items(*, products(name, product_code))')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as QuotationWithItems[];
        },
    });
};

export const useQuotation = (id: string) => {
    return useQuery({
        queryKey: ['quotations', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('quotations')
                .select('*, buyers(*), quotation_items(*, products(*))')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as QuotationWithItems | null;
        },
        enabled: !!id,
    });
};

interface CreateQuotationInput {
    quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>;
    items: Omit<QuotationItem, 'id' | 'quotation_id' | 'created_at'>[];
}

export const useCreateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ quotation, items }: CreateQuotationInput) => {
            // Create quotation
            const { data: quotationData, error: quotationError } = await supabase
                .from('quotations')
                .insert(quotation)
                .select()
                .single();

            if (quotationError) throw quotationError;

            // Create quotation items
            const itemsWithQuotationId = items.map(item => ({
                ...item,
                quotation_id: quotationData.id,
            }));

            const { error: itemsError } = await supabase
                .from('quotation_items')
                .insert(itemsWithQuotationId);

            if (itemsError) throw itemsError;

            return quotationData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast({ title: 'Quotation created successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error creating quotation', description: error.message, variant: 'destructive' });
        },
    });
};

export const useDeleteQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Delete quotation items first
            await supabase.from('quotation_items').delete().eq('quotation_id', id);
            // Then delete the quotation
            const { error } = await supabase.from('quotations').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast({ title: 'Quotation deleted successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error deleting quotation', description: error.message, variant: 'destructive' });
        },
    });
};

interface UpdateQuotationInput {
    quotationId: string;
    quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>;
    items: Omit<QuotationItem, 'id' | 'quotation_id' | 'created_at'>[];
}

export const useUpdateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ quotationId, quotation, items }: UpdateQuotationInput) => {
            // Update quotation
            const { data: quotationData, error: quotationError } = await supabase
                .from('quotations')
                .update(quotation)
                .eq('id', quotationId)
                .select()
                .single();

            if (quotationError) throw quotationError;

            // Delete existing quotation items
            await supabase.from('quotation_items').delete().eq('quotation_id', quotationId);

            // Create new quotation items
            const itemsWithQuotationId = items.map(item => ({
                ...item,
                quotation_id: quotationId,
            }));

            const { error: itemsError } = await supabase
                .from('quotation_items')
                .insert(itemsWithQuotationId);

            if (itemsError) throw itemsError;

            return quotationData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast({ title: 'Quotation updated successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error updating quotation', description: error.message, variant: 'destructive' });
        },
    });
};

export const useUpdateQuotationStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: QuotationStatus }) => {
            const { error } = await supabase
                .from('quotations')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast({ title: 'Quotation status updated successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error updating quotation status', description: error.message, variant: 'destructive' });
        },
    });
};
