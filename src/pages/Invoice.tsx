import { useParams, useNavigate } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

export function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div className="p-8">Invoice ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white">
      {/* Non-printable Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white dark:bg-gray-800 print:bg-white print:text-black border-b p-3 sm:p-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-sm sm:text-base"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Sales</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <Button
          onClick={() => {
            // Print with the invoice title already set by InvoiceTemplate
            window.print();
          }}
          className="flex items-center gap-2 text-sm sm:text-base"
        >
          <Printer size={16} />
          <span className="hidden sm:inline">Print Invoice</span>
          <span className="sm:hidden">Print</span>
        </Button>
      </div>

      {/* Printable Invoice */}
      <div className="print:p-0 p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-auto">
        <InvoiceTemplate saleId={id} />
      </div>
    </div>
  );
}
