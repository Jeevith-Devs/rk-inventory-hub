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
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateCategory,
  Product,
  ProductInput,
} from '@/hooks/useProducts';
import { ProductForm } from '@/components/forms/ProductForm';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Loader2, FolderPlus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.product_code.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    return categories?.find((c) => c.id === categoryId)?.name || '-';
  };

  const handleSubmit = (data: ProductInput) => {
    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, ...data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingProduct(undefined);
          },
        }
      );
    } else {
      createProduct.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleCategorySubmit = (data: z.infer<typeof categorySchema>) => {
    createCategory.mutate(
      { name: data.name, description: data.description || null },
      {
        onSuccess: () => {
          setIsCategoryFormOpen(false);
          categoryForm.reset();
        },
      }
    );
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (deletingProduct) {
      deleteProduct.mutate(deletingProduct.id, {
        onSuccess: () => setDeletingProduct(null),
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  return (
    <PageContainer
      title="Products"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCategoryFormOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{getCategoryName(product.category_id)}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell className="text-right">₹{product.purchase_price?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{product.selling_price?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        (product.current_stock || 0) <= (product.reorder_level || 0)
                          ? 'text-destructive font-medium'
                          : ''
                      }
                    >
                      {product.current_stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProduct(product)}
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

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmit}
            isLoading={createProduct.isPending || updateProduct.isPending}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCategoryFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Category
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot
              be undone.
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
