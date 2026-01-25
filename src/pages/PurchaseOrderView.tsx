import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { POTemplate } from '@/components/POTemplate';

export default function PurchaseOrderView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-lg text-muted-foreground">Invalid Purchase Order ID</p>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col bg-muted/30">
            {/* Header - Hidden when printing */}
            <div className="no-print bg-background border-b px-4 py-3 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/purchase-orders')}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Purchase Orders
                </Button>
                <Button onClick={handlePrint} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print / Download PDF
                </Button>
            </div>

            {/* PO Template */}
            <div className="flex-1 overflow-auto p-4 sm:p-8">
                <div className="max-w-[210mm] mx-auto shadow-lg bg-white rounded-sm ring-1 ring-border">
                    <POTemplate poId={id} />
                </div>
            </div>
        </div>
    );
}
