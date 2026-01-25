import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoiceNumber, generatePurchaseNumber, generateSupplierCode, generateBuyerCode, generateProductCode, generateQuotationNumber } from '@/lib/utils';

/**
 * Hook to get the next invoice number
 * Queries the database to get the next sequence number and formats it properly
 */
export const useNextInvoiceNumber = () => {
  return useQuery({
    queryKey: ['nextInvoiceNumber'],
    queryFn: async () => {
      // Get the count of sales in the current financial year to generate sequence
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      // Determine financial year start and end dates
      let fyStartYear = currentYear;
      if (currentMonth < 4) {
        fyStartYear = currentYear - 1;
      }

      const fyStart = new Date(fyStartYear, 3, 1); // April 1st
      const fyEnd = new Date(fyStartYear + 1, 2, 31); // March 31st

      const { data, error, count } = await supabase
        .from('sales')
        .select('id', { count: 'exact' })
        .gte('created_at', fyStart.toISOString())
        .lte('created_at', fyEnd.toISOString());

      if (error) {
        console.error('Error fetching invoice count:', error);
        // Fallback to timestamp-based if query fails
        return `INV-${Date.now().toString().slice(-8)}`;
      }

      // Sequence number starts from 1
      const sequenceNumber = (count || 0) + 1;
      return generateInvoiceNumber(sequenceNumber);
    },
    staleTime: 0, // Always refetch to get fresh count
  });
};

/**
 * Hook to get the next purchase number
 */
export const useNextPurchaseNumber = () => {
  return useQuery({
    queryKey: ['nextPurchaseNumber'],
    queryFn: async () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      let fyStartYear = currentYear;
      if (currentMonth < 4) {
        fyStartYear = currentYear - 1;
      }

      const fyStart = new Date(fyStartYear, 3, 1);
      const fyEnd = new Date(fyStartYear + 1, 2, 31);

      const { data, error, count } = await supabase
        .from('purchases')
        .select('id', { count: 'exact' })
        .gte('created_at', fyStart.toISOString())
        .lte('created_at', fyEnd.toISOString());

      if (error) {
        console.error('Error fetching purchase count:', error);
        return `PO-${Date.now().toString().slice(-8)}`;
      }

      const sequenceNumber = (count || 0) + 1;
      return generatePurchaseNumber(sequenceNumber);
    },
    staleTime: 0,
  });
};

/**
 * Hook to get the next supplier code
 */
export const useNextSupplierCode = () => {
  return useQuery({
    queryKey: ['nextSupplierCode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('supplier_code')
        .like('supplier_code', 'RK/SU/%')
        .order('supplier_code', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching supplier codes:', error);
        return `RK/SU/001`;
      }

      // Extract the highest number from existing codes
      let maxNumber = 0;
      if (data && data.length > 0) {
        const codes = data.map(s => s.supplier_code);
        for (const code of codes) {
          const match = code.match(/RK\/SU\/(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }

      // Next sequence number
      const sequenceNumber = maxNumber + 1;
      return generateSupplierCode(sequenceNumber);
    },
    staleTime: 0, // Always refetch to get fresh count
  });
};

/**
 * Hook to get the next buyer code
 */
export const useNextBuyerCode = () => {
  return useQuery({
    queryKey: ['nextBuyerCode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyers')
        .select('buyer_code')
        .like('buyer_code', 'RK/BU/%')
        .order('buyer_code', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching buyer codes:', error);
        return `RK/BU/001`;
      }

      // Extract the highest number from existing codes
      let maxNumber = 0;
      if (data && data.length > 0) {
        const codes = data.map(b => b.buyer_code);
        for (const code of codes) {
          const match = code.match(/RK\/BU\/(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }

      // Next sequence number
      const sequenceNumber = maxNumber + 1;
      return generateBuyerCode(sequenceNumber);
    },
    staleTime: 0, // Always refetch to get fresh count
  });
};

/**
 * Hook to get the next product code
 */
export const useNextProductCode = () => {
  return useQuery({
    queryKey: ['nextProductCode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_code')
        .like('product_code', 'RK-PD-%')
        .order('product_code', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching product codes:', error);
        return `RK-PD-001`;
      }

      // Extract the highest number from existing codes
      let maxNumber = 0;
      if (data && data.length > 0) {
        const codes = data.map(p => p.product_code);
        for (const code of codes) {
          const match = code.match(/RK-PD-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }

      // Next sequence number
      const sequenceNumber = maxNumber + 1;
      return generateProductCode(sequenceNumber);
    },
    staleTime: 0, // Always refetch to get fresh count
  });
};

/**
 * Hook to get the next quotation number
 */
export const useNextQuotationNumber = () => {
  return useQuery({
    queryKey: ['nextQuotationNumber'],
    queryFn: async () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      let fyStartYear = currentYear;
      if (currentMonth < 4) {
        fyStartYear = currentYear - 1;
      }

      const fyStart = new Date(fyStartYear, 3, 1);
      const fyEnd = new Date(fyStartYear + 1, 2, 31);

      const { data, error, count } = await supabase
        .from('quotations')
        .select('id', { count: 'exact' })
        .gte('created_at', fyStart.toISOString())
        .lte('created_at', fyEnd.toISOString());

      if (error) {
        console.error('Error fetching quotation count:', error);
        return `QT-${Date.now().toString().slice(-8)}`;
      }

      const sequenceNumber = (count || 0) + 1;
      return generateQuotationNumber(sequenceNumber);
    },
    staleTime: 0,
  });
};

