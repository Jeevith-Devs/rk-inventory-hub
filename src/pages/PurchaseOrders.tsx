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
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';

export default function PurchaseOrders() {
    const navigate = useNavigate();
    const { data: purchaseOrders, isLoading, error } = usePurchaseOrders();
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
            <PageContainer title="Purchase Orders">
                <div className="flex h-[400px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer title="Purchase Orders">
                <Card>
                    <CardContent className="p-6">
                        <div className="max-w-3xl mx-auto w-full text-center">
                            <h2 className="text-xl font-bold text-destructive mb-4">Error loading purchase orders</h2>
                            <p className="text-muted-foreground">{error.message}</p>
                        </div>
                    </CardContent>
                </Card>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title="Purchase Orders"
            actions={
                <Button onClick={() => navigate('/purchase-orders/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Purchase Order
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 sm:p-6 pb-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by PO number or vendor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="rounded-md border overflow-x-auto">
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
                                                            <Eye className="h-4 w-4" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/purchase-orders/edit/${po.id}`)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Pencil className="h-4 w-4" />
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
                                                            <Trash2 className="h-4 w-4" />
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
                </CardContent>
            </Card>
        </PageContainer>
    );
}
