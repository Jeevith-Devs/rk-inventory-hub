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
import { Badge } from '@/components/ui/badge';
import { useBuyers, useCreateBuyer, useUpdateBuyer, useDeleteBuyer, Buyer, BuyerInput } from '@/hooks/useBuyers';
import { BuyerForm } from '@/components/forms/BuyerForm';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function Buyers() {
  const { data: buyers, isLoading } = useBuyers();
  const createBuyer = useCreateBuyer();
  const updateBuyer = useUpdateBuyer();
  const deleteBuyer = useDeleteBuyer();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | undefined>();
  const [deletingBuyer, setDeletingBuyer] = useState<Buyer | null>(null);

  const filteredBuyers = buyers?.filter(
    (buyer) =>
      buyer.company_name.toLowerCase().includes(search.toLowerCase()) ||
      buyer.buyer_code.toLowerCase().includes(search.toLowerCase()) ||
      buyer.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data: BuyerInput) => {
    if (editingBuyer) {
      updateBuyer.mutate(
        { id: editingBuyer.id, ...data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingBuyer(undefined);
          },
        }
      );
    } else {
      createBuyer.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleEdit = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (deletingBuyer) {
      deleteBuyer.mutate(deletingBuyer.id, {
        onSuccess: () => setDeletingBuyer(null),
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBuyer(undefined);
  };

  return (
    <PageContainer
      title="Customers"
      actions={
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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
              <TableHead>Code</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Status</TableHead>
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
            ) : filteredBuyers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredBuyers?.map((buyer) => (
                <TableRow key={buyer.id}>
                  <TableCell className="font-mono text-sm">{buyer.buyer_code}</TableCell>
                  <TableCell className="font-medium">{buyer.company_name}</TableCell>
                  <TableCell>{buyer.contact_person || '-'}</TableCell>
                  <TableCell>{buyer.phone || '-'}</TableCell>
                  <TableCell>{buyer.city || '-'}</TableCell>
                  <TableCell>₹{buyer.credit_limit?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <Badge variant={buyer.is_active ? 'default' : 'secondary'}>
                      {buyer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(buyer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingBuyer(buyer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBuyer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          <BuyerForm
            buyer={editingBuyer}
            onSubmit={handleSubmit}
            isLoading={createBuyer.isPending || updateBuyer.isPending}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBuyer} onOpenChange={() => setDeletingBuyer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBuyer?.company_name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
