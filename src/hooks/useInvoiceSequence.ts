import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoiceNumber, generatePurchaseNumber } from '@/lib/utils';

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
