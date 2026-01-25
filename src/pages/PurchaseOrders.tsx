import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrders, useDeletePurchaseOrder } from '@/hooks/usePurchaseOrders';
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Eye, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

export default function PurchaseOrders() {
    const navigate = useNavigate();
    const { data: purchaseOrders, isLoading } = usePurchaseOrders();
    const deletePO = useDeletePurchaseOrder();

    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

    const filteredPOs = purchaseOrders?.filter((po) => {
        const matchesSearch =
            po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            po.suppliers?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const handleDelete = () => {
        if (selectedPOId) {
            deletePO.mutate(selectedPOId, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedPOId(null);
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b bg-background p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
                        <p className="text-sm text-muted-foreground">
                            Create and manage your purchase orders
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/purchase-orders/new')}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Purchase Order
                    </Button>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by PO number or vendor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Payment Term</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPOs && filteredPOs.length > 0 ? (
                                filteredPOs.map((po) => (
                                    <TableRow key={po.id}>
                                        <TableCell className="font-medium">{po.po_number}</TableCell>
                                        <TableCell>{po.suppliers?.company_name || 'N/A'}</TableCell>
                                        <TableCell>
                                            {format(new Date(po.po_date), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell>{po.payment_term || 'N/A'}</TableCell>
                                        <TableCell>₹{po.grand_total?.toLocaleString() || '0'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    <span className="hidden sm:inline">View</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/purchase-orders/edit/${po.id}`)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedPOId(po.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Delete</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Purchase Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this purchase order? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deletePO.isPending}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
