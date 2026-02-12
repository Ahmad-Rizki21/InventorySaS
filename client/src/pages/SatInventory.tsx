import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '../components/ui/badge';
import {
  Barcode,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Store,
  MapPin,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface ProductSat {
  id: string;
  sku: string;
  name: string;
}

interface ItemSat {
  id: string;
  productSatId: string;
  serialNumber: string;
  status: 'GUDANG' | 'TERPASANG' | 'RUSAK' | 'TEKNISI';
  milikPerangkat: string | null;
  idToko: string | null;
  namaToko: string | null;
  dc: string | null;
  brandToko: string | null;
  tglTerimaGudang: string | null;
  catatanTerima: string | null;
  tglKirimMitra: string | null;
  mitra: string | null;
  hargaPeplink: string | null;
  notes: string | null;
  product: ProductSat;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  GUDANG: { label: 'Gudang', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  TERPASANG: { label: 'Terpasang', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  RUSAK: { label: 'Rusak', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  TEKNISI: { label: 'Teknisi', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  DISMANTLE: { label: 'Dismantle', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  CM_DI_GUDANG: { label: 'CM Di Gudang', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  CM_DI_NOC: { label: 'CM Di NOC', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  CM_DI_TEKNISI: { label: 'CM Di Teknisi', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  HILANG: { label: 'Hilang', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' },
  MIGRASI: { label: 'Migrasi', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  PROSES_INSTALASI: { label: 'Proses Instalasi', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  PROSES_MIGRASI: { label: 'Proses Migrasi', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  REPAIR: { label: 'Repair', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  RUSAK_DI_TEKNISI: { label: 'Rusak Di Teknisi', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  RUSAK_DI_TOKO: { label: 'Rusak Di Toko', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
};

const ITEMS_PER_PAGE = 10;

export function SatInventory() {
  const [items, setItems] = useState<ItemSat[]>([]);
  const [products, setProducts] = useState<ProductSat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemSat | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productSatId: '',
    serialNumber: '',
    status: 'GUDANG',
    milikPerangkat: '',
    idToko: '',
    namaToko: '',
    dc: '',
    brandToko: '',
    tglTerimaGudang: '',
    catatanTerima: '',
    tglKirimMitra: '',
    mitra: '',
    hargaPeplink: '',
    notes: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_URL}/api/sat/items?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch SAT items:', error);
      toast.error('Gagal mengambil data inventory SAT');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch SAT products:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [statusFilter, searchQuery]);

  const resetForm = () => {
    setFormData({
      productSatId: '',
      serialNumber: '',
      status: 'GUDANG',
      milikPerangkat: '',
      idToko: '',
      namaToko: '',
      dc: '',
      brandToko: '',
      tglTerimaGudang: '',
      catatanTerima: '',
      tglKirimMitra: '',
      mitra: '',
      hargaPeplink: '',
      notes: '',
    });
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Unit SAT berhasil ditambahkan');
        setAddDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Gagal menambah unit');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/items/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Unit SAT berhasil diperbarui');
        setEditDialogOpen(false);
        fetchItems();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Gagal memperbarui unit');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/items/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Unit SAT berhasil dihapus');
        setDeleteDialogOpen(false);
        fetchItems();
      }
    } catch (error) {
      toast.error('Gagal menghapus unit');
    }
  };

  const openEditDialog = (item: ItemSat) => {
    setSelectedItem(item);
    setFormData({
      productSatId: item.productSatId,
      serialNumber: item.serialNumber,
      status: item.status,
      milikPerangkat: item.milikPerangkat || '',
      idToko: item.idToko || '',
      namaToko: item.namaToko || '',
      dc: item.dc || '',
      brandToko: item.brandToko || '',
      tglTerimaGudang: item.tglTerimaGudang ? new Date(item.tglTerimaGudang).toISOString().split('T')[0] : '',
      catatanTerima: item.catatanTerima || '',
      tglKirimMitra: item.tglKirimMitra ? new Date(item.tglKirimMitra).toISOString().split('T')[0] : '',
      mitra: item.mitra || '',
      hargaPeplink: item.hargaPeplink || '',
      notes: item.notes || '',
    });
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory SAT</h1>
          <p className="text-muted-foreground">Kelola unit Peplink dan perangkat SAT lainnya</p>
        </div>
        <Button onClick={() => { resetForm(); setAddDialogOpen(true); }} className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm">
          <Plus className="h-4 w-4" />
          Tambah Unit SAT
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari SN, ID Toko, Nama Toko, DC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.keys(statusConfig).map(status => (
                  <SelectItem key={status} value={status}>{statusConfig[status].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Perangkat SAT</CardTitle>
          <CardDescription>Menampilkan semua unit Peplink yang terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SN</TableHead>
                  <TableHead>Perangkat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Toko / DC</TableHead>
                  <TableHead>Terima di Gudang</TableHead>
                  <TableHead>Kirim ke Mitra</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10">Data tidak ditemukan</TableCell></TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.serialNumber}</TableCell>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>
                        <Badge className={cn('border', statusConfig[item.status].color)}>
                          {statusConfig[item.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{item.idToko || '-'} / {item.brandToko || '-'}</div>
                          <div className="text-xs text-muted-foreground">{item.namaToko || '-'} ({item.dc || '-'})</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(item.tglTerimaGudang)}</div>
                          <div className="text-xs text-muted-foreground">{item.catatanTerima || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(item.tglKirimMitra)}</div>
                          <div className="text-xs text-muted-foreground">{item.mitra || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => { if(!open) { setAddDialogOpen(false); setEditDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Unit SAT' : 'Tambah Unit SAT Baru'}</DialogTitle>
            <DialogDescription>Masukkan detail informasi perangkat SAT</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label>Produk / Perangkat *</Label>
              <Select value={formData.productSatId} onValueChange={(v) => setFormData({...formData, productSatId: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Perangkat" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number *</Label>
              <Input value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} placeholder="Contoh: 192C-..." />
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(statusConfig).map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Milik Perangkat</Label>
              <Select value={formData.milikPerangkat} onValueChange={(v) => setFormData({...formData, milikPerangkat: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Pemilik" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSTEL">TRANSTEL</SelectItem>
                  <SelectItem value="JEDI">JEDI</SelectItem>
                  <SelectItem value="ORIX">ORIX</SelectItem>
                  <SelectItem value="ARTACOM">ARTACOM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand Toko</Label>
              <Select value={formData.brandToko} onValueChange={(v) => setFormData({...formData, brandToko: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alfamart">Alfamart</SelectItem>
                  <SelectItem value="Lawson">Lawson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Toko</Label>
              <Input value={formData.idToko} onChange={(e) => setFormData({...formData, idToko: e.target.value})} placeholder="Contoh: OA36" />
            </div>
            <div className="space-y-2">
              <Label>Nama Toko</Label>
              <Input value={formData.namaToko} onChange={(e) => setFormData({...formData, namaToko: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>DC</Label>
              <Input value={formData.dc} onChange={(e) => setFormData({...formData, dc: e.target.value})} placeholder="Contoh: KLATEN" />
            </div>
            <div className="space-y-2">
              <Label>Tgl Terima Gudang</Label>
              <Input type="date" value={formData.tglTerimaGudang} onChange={(e) => setFormData({...formData, tglTerimaGudang: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Catatan Terima</Label>
              <Input value={formData.catatanTerima} onChange={(e) => setFormData({...formData, catatanTerima: e.target.value})} placeholder="Keterangan tgl terima" />
            </div>
            <div className="space-y-2">
              <Label>Tgl Kirim Mitra</Label>
              <Input type="date" value={formData.tglKirimMitra} onChange={(e) => setFormData({...formData, tglKirimMitra: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Mitra</Label>
              <Input value={formData.mitra} onChange={(e) => setFormData({...formData, mitra: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Harga Peplink / Transtel</Label>
              <Input value={formData.hargaPeplink} onChange={(e) => setFormData({...formData, hargaPeplink: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Catatan Tambahan</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); setEditDialogOpen(false); }}>Batal</Button>
            <Button onClick={editDialogOpen ? handleUpdate : handleCreate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Unit SAT</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus SN {selectedItem?.serialNumber}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
