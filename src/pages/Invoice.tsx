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
    <div>
      {/* Non-printable Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white border-b p-4 flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Sales
        </Button>
        <Button
          onClick={() => window.print()}
          className="flex items-center gap-2"
        >
          <Printer size={16} />
          Print Invoice
        </Button>
      </div>

      {/* Printable Invoice */}
      <div className="print:p-0">
        <InvoiceTemplate saleId={id} />
      </div>
    </div>
  );
}
