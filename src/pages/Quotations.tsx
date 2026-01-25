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
import { Plus, Search, MoreHorizontal, Eye, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

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
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show migration instructions if database tables don't exist
    if (error) {
        return (
            <div className="flex h-full flex-col p-4 sm:p-6">
                <div className="max-w-3xl mx-auto w-full">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-4">
                            ⚠️ Database Migration Required
                        </h2>
                        <p className="text-yellow-800 dark:text-yellow-300 mb-4">
                            The quotations feature requires database tables that haven't been created yet.
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <p className="font-semibold">Steps to enable quotations:</p>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                <li>Go to your Supabase project dashboard</li>
                                <li>Navigate to <strong>SQL Editor</strong></li>
                                <li>Create a new query</li>
                                <li>
                                    Copy the SQL from:{' '}
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        supabase/migrations/20260125060000_add_quotations.sql
                                    </code>
                                </li>
                                <li>Run the query to create the quotation tables</li>
                                <li>Refresh this page</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b bg-background p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
                        <p className="text-sm text-muted-foreground">
                            Create and manage your quotations
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/quotations/new')}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Quotation
                    </Button>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by quotation number or customer..."
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
                                                    <Eye className="h-3 w-3" />
                                                    <span className="hidden sm:inline">View</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Pencil className="h-3 w-3" />
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
        </div>
    );
}
