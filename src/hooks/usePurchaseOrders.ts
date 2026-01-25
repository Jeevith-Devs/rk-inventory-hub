import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PurchaseOrder {
    id: string;
    po_number: string;
    vendor_id: string;
    po_date: string;
    revision_no: string | null;
    quotation_ref: string | null;
    payment_term: string | null;
    transportation: string | null;
    delivery_term: string | null;
    subtotal: number | null;
    cgst_amount: number | null;
    sgst_amount: number | null;
    igst_amount: number | null;
    total_amount: number | null;
    round_off: number | null;
    grand_total: number | null;
    notes: string | null;
    terms_conditions: string | null;
    is_gst_po: boolean | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrderItem {
    id: string;
    po_id: string;
    product_id: string;
    order_quantity: number;
    unit_rate: number;
    total_basic: number;
    tax_percent: number | null;
    sgst_amount: number | null;
    cgst_amount: number | null;
    igst_amount: number | null;
    order_value: number;
    created_at: string;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
    suppliers?: {
        company_name: string;
        billing_address: string | null;
        delivery_address: string | null;
        gst_no: string | null;
        contact_person: string | null;
        phone: string | null;
    };
    purchase_order_items?: (PurchaseOrderItem & {
        products?: {
            name: string;
            product_code: string;
            hsn_code: string | null;
            unit: string | null;
        };
    })[];
}

export const usePurchaseOrders = () => {
    return useQuery({
        queryKey: ['purchase-orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*, suppliers(company_name), purchase_order_items(*, products(name, product_code))')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as PurchaseOrderWithItems[];
        },
    });
};

export const usePurchaseOrder = (id: string) => {
    return useQuery({
        queryKey: ['purchase-orders', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*, suppliers(*), purchase_order_items(*, products(*))')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as PurchaseOrderWithItems | null;
        },
        enabled: !!id,
    });
};

interface CreatePurchaseOrderInput {
    purchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>;
    items: Omit<PurchaseOrderItem, 'id' | 'po_id' | 'created_at'>[];
}

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ purchaseOrder, items }: CreatePurchaseOrderInput) => {
            // Create purchase order
            const { data: poData, error: poError } = await supabase
                .from('purchase_orders')
                .insert(purchaseOrder)
                .select()
                .single();

            if (poError) throw poError;

            // Create purchase order items
            const itemsWithPOId = items.map(item => ({
                ...item,
                po_id: poData.id,
            }));

            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(itemsWithPOId);

            if (itemsError) throw itemsError;

            return poData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast({ title: 'Purchase Order created successfully' });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error creating purchase order',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

export const useDeletePurchaseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Delete purchase order items first
            await supabase.from('purchase_order_items').delete().eq('po_id', id);
            // Then delete the purchase order
            const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast({ title: 'Purchase Order deleted successfully' });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error deleting purchase order',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

interface UpdatePurchaseOrderInput {
    poId: string;
    purchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>;
    items: Omit<PurchaseOrderItem, 'id' | 'po_id' | 'created_at'>[];
}

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ poId, purchaseOrder, items }: UpdatePurchaseOrderInput) => {
            // Update purchase order
            const { data: poData, error: poError } = await supabase
                .from('purchase_orders')
                .update(purchaseOrder)
                .eq('id', poId)
                .select()
                .single();

            if (poError) throw poError;

            // Delete existing items
            await supabase.from('purchase_order_items').delete().eq('po_id', poId);

            // Create new items
            const itemsWithPOId = items.map(item => ({
                ...item,
                po_id: poId,
            }));

            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(itemsWithPOId);

            if (itemsError) throw itemsError;

            return poData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast({ title: 'Purchase Order updated successfully' });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error updating purchase order',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
