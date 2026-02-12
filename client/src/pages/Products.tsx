import { useState, useEffect } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Box,
  Wrench,
  Cable,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const categories = [
  { value: 'Active', label: 'ONT / Active', icon: Package, description: 'ONT/AP, Router' },
  { value: 'Passive', label: 'Kabel / Passive', icon: Cable, description: 'Kabel, Splitter' },
  { value: 'Tool', label: 'Tools', icon: Wrench, description: 'Splicer, Tangga' },
];

const units = ['Pcs', 'Meter', 'Lot', 'Roll'];
const ITEMS_PER_PAGE = 10;

interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  unit: string;
}

export function Products() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    category: 'Active',
    unit: 'Pcs',
  });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    Active: 1,
    Passive: 1,
    Tool: 1,
  });

  const { data: products, isLoading, error } = useProducts(
    search ? { search } : {}
  );

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }

    handleCloseDialog();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
    });
    setDialogOpen(true);
  };

  const handleDelete = (product: any) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    await deleteMutation.mutateAsync(deletingProduct.id);
    setDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({ sku: '', name: '', category: 'Active', unit: 'Pcs' });
  };

  const toggleSection = (category: string) => {
    setCollapsedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const filterProducts = (category: string) => {
    // Ensure products is an array before filtering
    if (!products || !Array.isArray(products)) {
      return [];
    }

    let filtered = [...products];

    // Filter by category
    filtered = filtered.filter((p: any) => p.category === category);

    // Filter by search
    if (search) {
      filtered = filtered.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const getCategoryProducts = (category: string) => {
    return filterProducts(category);
  };

  const getTotalStock = (category: string) => {
    const catProducts = getCategoryProducts(category);
    return catProducts.reduce((sum: number, p: any) => sum + (p.totalStock || 0), 0);
  };

  const getTotalItems = (category: string) => {
    const catProducts = getCategoryProducts(category);
    return catProducts.reduce((sum: number, p: any) => sum + (p.itemCount || 0), 0);
  };

  const getLowStockCount = (category: string) => {
    const catProducts = getCategoryProducts(category);
    return catProducts.filter((p: any) => p.totalStock < 10).length;
  };

  const getPaginatedProducts = (category: string) => {
    const catProducts = getCategoryProducts(category);
    const page = currentPage[category] || 1;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return catProducts.slice(startIndex, endIndex);
  };

  const getTotalPages = (category: string) => {
    const catProducts = getCategoryProducts(category);
    return Math.ceil(catProducts.length / ITEMS_PER_PAGE);
  };

  const handlePageChange = (category: string, newPage: number) => {
    setCurrentPage(prev => ({ ...prev, [category]: newPage }));
  };

  const handlePrevPage = (category: string) => {
    const currentPageNum = currentPage[category] || 1;
    if (currentPageNum > 1) {
      handlePageChange(category, currentPageNum - 1);
    }
  };

  const handleNextPage = (category: string) => {
    const currentPageNum = currentPage[category] || 1;
    const totalPages = getTotalPages(category);
    if (currentPageNum < totalPages) {
      handlePageChange(category, currentPageNum + 1);
    }
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage({ Active: 1, Passive: 1, Tool: 1 });
  }, [search]);

  // Download Excel Template for Products
  const handleDownloadTemplate = (category: string) => {
    // Data sheet
    const templateData = [
      {
        'SKU': 'SKU-ONT-001',
        'Nama Produk': 'ONT Huawei HG8245H',
        'Kategori': category,
        'Satuan': 'Unit',
        'Stok Minimal': 5,
        'Deskripsi': 'Ont 4 Port + Wi-Fi',
      },
      {
        'SKU': 'SKU-CAB-002',
        'Nama Produk': 'Patch Cord 3M SC/UPC',
        'Kategori': category,
        'Satuan': 'Pcs',
        'Stok Minimal': 10,
        'Deskripsi': 'Kabel jumper 3 meter',
      },
    ];

    // Instructions sheet
    const instructionData = [
      { 'Petunjuk Pengisian': '1. Kolom SKU WAJIB unik dan digunakan untuk referensi di inventory (Serial Number).' },
      { 'Petunjuk Pengisian': '2. Kolom Nama Produk diisi dengan nama lengkap barang.' },
      { 'Petunjuk Pengisian': '3. Kolom Kategori sudah otomatis terisi sesuai halaman, namun bisa diganti jika perlu.' },
      { 'Petunjuk Pengisian': '4. Kolom Satuan bisa diisi: Pcs, Unit, Meter, Roll, dll.' },
      { 'Petunjuk Pengisian': '5. Kolom Stok Minimal adalah batas peringatan untuk stok rendah.' },
      { 'Petunjuk Pengisian': '6. Hapus baris contoh sebelum melakukan import data Anda.' },
    ];

    const wb = XLSX.utils.book_new();
    
    // Create Import Sheet
    const wsImport = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, wsImport, 'Template Import');
    
    // Create Instruction Sheet
    const wsInfo = XLSX.utils.json_to_sheet(instructionData);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'PETUNJUK');

    XLSX.writeFile(wb, `Template_Import_Produk_${category.replace(/\//g, '_')}.xlsx`);
    toast.success(`Template ${category} berhasil didownload`);
  };

  // Import Excel for Products
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error('File Excel kosong');
          return;
        }

        // Map columns to match backend expectation
        const formattedProducts = data.map((row: any) => ({
          sku: row['SKU']?.toString().trim(),
          name: row['Nama Produk']?.toString().trim(),
          category: row['Kategori']?.toString().trim() || category,
          unit: row['Satuan'] || 'Pcs',
          minStock: row['Stok Minimal'],
          description: row['Deskripsi'],
        }));

        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/products/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ products: formattedProducts }),
        });

        const result = await response.json();
        if (response.ok) {
          if (result.results && result.results.failed > 0) {
            toast.warning(result.message, {
              description: result.results.errors.join('\n'),
              duration: 5000,
            });
          } else {
            toast.success(result.message);
          }
          // Use setTimeout to allow toast to be seen before reload
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error(result.error || 'Gagal mengimport data');
        }
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Gagal membaca file Excel');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Check for both React Query error and API-returned error object
  const apiError = products && typeof products === 'object' && !Array.isArray(products) && (products as any).error;

  if (error || apiError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 font-medium font-outfit">Terjadi Kesalahan</p>
          <p className="text-sm text-muted-foreground mt-2 font-outfit">
            {apiError || (error as any)?.message || 'Gagal memuat data produk'}
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Produk</h1>
          <p className="text-muted-foreground">Kelola daftar produk di sistem inventory</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Sections */}
      {categories.map((category) => {
        const Icon = category.icon;
        const isCollapsed = collapsedSections[category.value];
        const catProducts = getCategoryProducts(category.value);
        const paginatedProducts = getPaginatedProducts(category.value);
        const totalStock = getTotalStock(category.value);
        const totalItems = getTotalItems(category.value);
        const lowStockCount = getLowStockCount(category.value);
        const totalPages = getTotalPages(category.value);
        const currentPageNum = currentPage[category.value] || 1;

        return (
          <Card key={category.value} className="overflow-hidden">
            {/* Category Header */}
            <CardHeader
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                isCollapsed ? 'pb-3' : ''
              }`}
              onClick={() => toggleSection(category.value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{category.label}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold">{catProducts.length}</p>
                    <p className="text-xs text-muted-foreground">Produk</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold">{totalStock}</p>
                    <p className="text-xs text-muted-foreground">Total Stok</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold">{totalItems}</p>
                    <p className="text-xs text-muted-foreground">Items (SN)</p>
                  </div>
                  {lowStockCount > 0 && (
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                      <p className="text-xs text-muted-foreground">Stok Rendah</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 border-l pl-4 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTemplate(category.value);
                      }}
                      title="Download Template Excel"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden lg:inline">Format Excel</span>
                    </Button>
                    <div onClick={(e) => e.stopPropagation()}>
                      <label htmlFor={`import-excel-${category.value}`} className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3 h-9 text-sm font-medium border rounded-md hover:bg-accent transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="hidden lg:inline">Import Excel</span>
                        </div>
                        <input
                          id={`import-excel-${category.value}`}
                          type="file"
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={(e) => handleImportExcel(e, category.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon">
                    {isCollapsed ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Products Table */}
            {!isCollapsed && (
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">Loading...</div>
                  </div>
                ) : catProducts.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Nama Produk</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead>Items (SN)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedProducts.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.sku}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  {product.name}
                                </div>
                              </TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell>
                                <span className={product.totalStock < 10 ? 'text-red-600 font-medium' : ''}>
                                  {product.totalStock} {product.unit === 'Pcs' ? '' : product.unit}
                                </span>
                              </TableCell>
                              <TableCell>{product.itemCount} item</TableCell>
                              <TableCell>
                                {product.totalStock < 10 ? (
                                  <Badge variant="destructive">Low Stock</Badge>
                                ) : product.totalStock === 0 ? (
                                  <Badge variant="outline">Out of Stock</Badge>
                                ) : (
                                  <Badge className="bg-green-500">In Stock</Badge>
                                )}
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
                                    onClick={() => handleDelete(product)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Menampilkan {(currentPageNum - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPageNum * ITEMS_PER_PAGE, catProducts.length)} dari {catProducts.length} produk
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrevPage(category.value)}
                            disabled={currentPageNum === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={currentPageNum === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => handlePageChange(category.value, page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNextPage(category.value)}
                            disabled={currentPageNum === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Tidak ada produk di kategori ini</p>
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? 'Coba kata kunci pencarian lain'
                        : `Silakan tambah produk ${category.label}`}
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Edit informasi produk yang sudah ada'
                : 'Tambah produk baru ke sistem inventory'}
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={handleCloseDialog} />

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="Contoh: ONT-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: ONT ZTE F609"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Kategori *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} - {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unit *</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : editingProduct
                  ? 'Simpan Perubahan'
                  : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus produk <strong>{deletingProduct?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={() => setDeleteDialogOpen(false)} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
