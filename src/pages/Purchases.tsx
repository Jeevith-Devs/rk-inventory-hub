import { useState } from 'react';
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
import { usePurchases, useDeletePurchase } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { PurchaseForm } from '@/components/forms/PurchaseForm';
import { format } from 'date-fns';
import { Plus, Search, Loader2, Eye, Trash2, Download } from 'lucide-react';
import { exportPurchasesToExcel } from '@/lib/excelExport';

export default function Purchases() {
  const { data: purchases, isLoading } = usePurchases();
  const { data: suppliers } = useSuppliers();
  const deletePurchase = useDeletePurchase();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<string | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<{ id: string; purchase_number: string } | null>(null);

  const filteredPurchases = purchases?.filter(
    (purchase) =>
      purchase.purchase_number.toLowerCase().includes(search.toLowerCase()) ||
      purchase.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    return suppliers?.find((s) => s.id === supplierId)?.company_name || '-';
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (deletingPurchase) {
      deletePurchase.mutate(deletingPurchase.id, {
        onSuccess: () => setDeletingPurchase(null),
      });
    }
  };

  return (
    <PageContainer
      title="Stock In (Purchases)"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => purchases && exportPurchasesToExcel(purchases)}
            disabled={!purchases || purchases.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase
          </Button>
        </div>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by purchase or invoice number..."
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
              <TableHead>Purchase #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
            ) : filteredPurchases?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No purchases found
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchases?.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-sm">{purchase.purchase_number}</TableCell>
                  <TableCell>{format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{getSupplierName(purchase.supplier_id)}</TableCell>
                  <TableCell>{purchase.invoice_number || '-'}</TableCell>
                  <TableCell className="text-right">₹{purchase.subtotal?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{purchase.tax_amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">₹{purchase.total_amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingPurchase(purchase.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPurchase({ id: purchase.id, purchase_number: purchase.purchase_number })}
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

      {/* Purchase Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Entry</DialogTitle>
          </DialogHeader>
          <PurchaseForm onSuccess={handleCloseForm} onCancel={handleCloseForm} />
        </DialogContent>
      </Dialog>

      {/* View Purchase Details Dialog */}
      <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          {viewingPurchase && <PurchaseDetails purchaseId={viewingPurchase} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPurchase} onOpenChange={() => setDeletingPurchase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase "{deletingPurchase?.purchase_number}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePurchase.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePurchase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function PurchaseDetails({ purchaseId }: { purchaseId: string }) {
  const { data: purchases } = usePurchases();
  const { data: suppliers } = useSuppliers();

  const purchase = purchases?.find((p) => p.id === purchaseId);
  const supplier = suppliers?.find((s) => s.id === purchase?.supplier_id);

  if (!purchase) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Purchase Number</p>
          <p className="font-medium">{purchase.purchase_number}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Purchase Date</p>
          <p className="font-medium">{format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Supplier</p>
          <p className="font-medium">{supplier?.company_name || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <p className="font-medium">{purchase.invoice_number || '-'}</p>
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{purchase.subtotal?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>₹{purchase.tax_amount?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-₹{purchase.discount_amount?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2 mt-2">
          <span>Total:</span>
          <span>₹{purchase.total_amount?.toLocaleString()}</span>
        </div>
      </div>
      {purchase.notes && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">Notes</p>
          <p>{purchase.notes}</p>
        </div>
      )}
    </div>
  );
}
