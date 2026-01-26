import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotations, useDeleteQuotation } from '@/hooks/useQuotations';
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

export default function Quotations() {
    const navigate = useNavigate();
    const { data: quotations, isLoading, error } = useQuotations();
    const deleteQuotation = useDeleteQuotation();

    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

    const filteredQuotations = quotations?.filter((quotation) => {
        const matchesSearch =
            quotation.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            quotation.buyers?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const handleDelete = () => {
        if (selectedQuotationId) {
            deleteQuotation.mutate(selectedQuotationId, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedQuotationId(null);
                },
            });
        }
    };

    if (isLoading) {
        return (
            <PageContainer title="Quotations">
                <div className="flex h-[400px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer title="Quotations">
                <Card>
                    <CardContent className="p-6">
                        <div className="max-w-3xl mx-auto w-full text-center">
                            <h2 className="text-xl font-bold text-destructive mb-4">Error loading quotations</h2>
                            <p className="text-muted-foreground">{error.message}</p>
                        </div>
                    </CardContent>
                </Card>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title="Quotations"
            actions={
                <Button onClick={() => navigate('/quotations/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Quotation
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 sm:p-6 pb-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by quotation number or customer..."
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
                                        <TableHead>Quotation No.</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Valid Until</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredQuotations && filteredQuotations.length > 0 ? (
                                        filteredQuotations.map((quotation) => (
                                            <TableRow key={quotation.id}>
                                                <TableCell className="font-medium">
                                                    {quotation.quotation_number}
                                                </TableCell>
                                                <TableCell>{quotation.buyers?.company_name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {format(new Date(quotation.quotation_date), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(quotation.valid_until), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell>₹{quotation.grand_total?.toLocaleString() || '0'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/quotations/${quotation.id}`)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedQuotationId(quotation.id);
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
                                                No quotations found.
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
                                <DialogTitle>Delete Quotation</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this quotation? This action cannot be undone.
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
                                    disabled={deleteQuotation.isPending}
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
