import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSat {
  id: string;
  sku: string;
  name: string;
  itemCount: number;
  availableItems: number;
  deployedItems: number;
}

export function SatProducts() {
  const [products, setProducts] = useState<ProductSat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSat | null>(null);
  const [formData, setFormData] = useState({ sku: '', name: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_URL}/api/sat/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data produk SAT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedProduct 
        ? `${API_URL}/api/sat/products/${selectedProduct.id}`
        : `${API_URL}/api/sat/products`;
      
      const response = await fetch(url, {
        method: selectedProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(selectedProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
        setDialogOpen(false);
        fetchProducts();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      toast.error('Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Produk berhasil dihapus');
        fetchProducts();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Gagal menghapus');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Produk SAT</h1>
          <p className="text-muted-foreground">Master data perangkat SAT (Peplink, dsb)</p>
        </div>
        <Button onClick={() => { setSelectedProduct(null); setFormData({sku:'', name:''}); setDialogOpen(true); }} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 gap-2">
          <Plus className="h-4 w-4" />
          Tambah Produk SAT
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama produk atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Master Produk SAT</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Total Unit</TableHead>
                <TableHead>Tersedia</TableHead>
                <TableHead>Terpasang</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10">Data tidak ditemukan</TableCell></TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.itemCount}</TableCell>
                    <TableCell className="text-blue-600 font-semibold">{product.availableItems}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{product.deployedItems}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { 
                          setSelectedProduct(product); 
                          setFormData({sku: product.sku, name: product.name}); 
                          setDialogOpen(true); 
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>SKU / Model *</Label>
              <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="Contoh: PEPLINK-B20X" />
            </div>
            <div className="space-y-2">
              <Label>Nama Produk *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Contoh: PEPLINK BALANCE 20X" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
