import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { SupplierForm } from '@/components/forms/SupplierForm';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const { isAdmin } = useAuth();

  const filteredSuppliers = suppliers?.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (data: SupplierInput) => {
    createSupplier.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const handleUpdate = (data: SupplierInput) => {
    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier.id, ...data }, {
        onSuccess: () => setEditingSupplier(null),
      });
    }
  };

  const handleDelete = () => {
    if (deletingSupplier) {
      deleteSupplier.mutate(deletingSupplier.id, {
        onSuccess: () => setDeletingSupplier(null),
      });
    }
  };

  return (
    <PageContainer 
      title="Suppliers"
      actions={
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>GST No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers && filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                        <TableCell>{supplier.company_name}</TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>{supplier.gst_no || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingSupplier(supplier)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Enter the supplier details below.</DialogDescription>
          </DialogHeader>
          <SupplierForm 
            onSubmit={handleCreate} 
            isLoading={createSupplier.isPending}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update the supplier details below.</DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <SupplierForm 
              supplier={editingSupplier}
              onSubmit={handleUpdate} 
              isLoading={updateSupplier.isPending}
              onCancel={() => setEditingSupplier(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSupplier?.company_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
