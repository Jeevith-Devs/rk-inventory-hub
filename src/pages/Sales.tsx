import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSales, useDeleteSale } from '@/hooks/useSales';
import { useBuyers } from '@/hooks/useBuyers';
import { SaleForm } from '@/components/forms/SaleForm';
import { format } from 'date-fns';
import { Plus, Search, Loader2, Eye, FileText, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Sales() {
  const { data: sales, isLoading } = useSales();
  const { data: buyers } = useBuyers();
  const deleteSale = useDeleteSale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [viewingSale, setViewingSale] = useState<string | null>(null);
  const [deletingSale, setDeletingSale] = useState<{ id: string; invoice_number: string } | null>(null);

  const filteredSales = sales?.filter((sale) =>
    sale.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const getBuyerName = (buyerId: string) => {
    return buyers?.find((b) => b.id === buyerId)?.company_name || '-';
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSale(null);
  };

  const handleDelete = () => {
    if (deletingSale) {
      deleteSale.mutate(deletingSale.id, {
        onSuccess: () => setDeletingSale(null),
      });
    }
  };

  return (
    <PageContainer
      title="Stock Out (Sales)"
      actions={
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredSales?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              filteredSales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">{sale.invoice_number}</TableCell>
                  <TableCell>{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{getBuyerName(sale.buyer_id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.payment_mode}</Badge>
                  </TableCell>
                  <TableCell className="text-right">₹{sale.subtotal?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    ₹{((sale.cgst_amount || 0) + (sale.sgst_amount || 0) + (sale.igst_amount || 0)).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{sale.grand_total?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingSale(sale.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingSale(sale.id);
                          setIsFormOpen(true);
                        }}
                        title="Edit Sale"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/invoice/${sale.id}`)}
                        title="Print Invoice"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSale({ id: sale.id, invoice_number: sale.invoice_number })}
                        title="Delete Sale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sale Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Sales Invoice</DialogTitle>
          </DialogHeader>
          <SaleForm
            saleId={editingSale || undefined}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* View Sale Details Dialog */}
      <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewingSale && <SaleDetails saleId={viewingSale} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSale} onOpenChange={() => setDeletingSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice "{deletingSale?.invoice_number}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSale.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function SaleDetails({ saleId }: { saleId: string }) {
  const { data: sales } = useSales();
  const { data: buyers } = useBuyers();

  const sale = sales?.find((s) => s.id === saleId);
  const buyer = buyers?.find((b) => b.id === sale?.buyer_id);

  if (!sale) return <div>Loading...</div>;

  const totalTax = (sale.cgst_amount || 0) + (sale.sgst_amount || 0) + (sale.igst_amount || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <p className="font-medium">{sale.invoice_number}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Sale Date</p>
          <p className="font-medium">{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Customer</p>
          <p className="font-medium">{buyer?.company_name || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Payment Mode</p>
          <p className="font-medium">{sale.payment_mode}</p>
        </div>
        {sale.vehicle_no && (
          <div>
            <p className="text-sm text-muted-foreground">Vehicle No</p>
            <p className="font-medium">{sale.vehicle_no}</p>
          </div>
        )}
        {sale.lr_no && (
          <div>
            <p className="text-sm text-muted-foreground">LR No</p>
            <p className="font-medium">{sale.lr_no}</p>
          </div>
        )}
      </div>
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{sale.subtotal?.toLocaleString()}</span>
        </div>
        {sale.cgst_amount ? (
          <>
            <div className="flex justify-between">
              <span>CGST:</span>
              <span>₹{sale.cgst_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST:</span>
              <span>₹{sale.sgst_amount?.toLocaleString()}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <span>IGST:</span>
            <span>₹{sale.igst_amount?.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-₹{sale.discount_amount?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Transport:</span>
          <span>₹{sale.transport_charges?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2 mt-2">
          <span>Grand Total:</span>
          <span>₹{sale.grand_total?.toFixed(2)}</span>
        </div>
      </div>
      {sale.notes && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">Notes</p>
          <p>{sale.notes}</p>
        </div>
      )}
    </div>
  );
}
