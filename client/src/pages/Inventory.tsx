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
  MapPin,
  Package,
  Cable,
  Wrench,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Upload,
  Files,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ItemTimeline } from '../components/ItemTimeline';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const categories = [
  { value: 'Active', label: 'ONT / Active', icon: Package, description: 'ONT/AP, Router, Modem' },
  { value: 'Passive', label: 'Kabel / Passive', icon: Cable, description: 'Kabel, Splitter, Konektor' },
  { value: 'Tool', label: 'Tools', icon: Wrench, description: 'Splicer, Tangka, Tools lainnya' },
];

const ITEMS_PER_PAGE = 10;

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
}

interface ItemDetail {
  id: string;
  productId: string;
  serialNumber: string;
  macAddress: string | null;
  status: 'GUDANG' | 'TERPASANG' | 'RUSAK' | 'TEKNISI' | 'DI_OPERASIONAL_RUSUN_FTTH' | 'DI_WAREHOUSE_GUDANG' | 'DIOPERASIONAL_PERUMAHAN_FTTH' | 'PINUS_LUAR' | 'REPAIR' | 'TERPASANG_DI_PERUMAHAN' | 'TERPASANG_DI_RUSUN';
  purchaseDate: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  notes: string | null;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  GUDANG: {
    label: 'Gudang',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  TERPASANG: {
    label: 'Terpasang',
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  RUSAK: {
    label: 'Rusak',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  TEKNISI: {
    label: 'Teknisi',
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  DI_OPERASIONAL_RUSUN_FTTH: {
    label: 'Operasional Rusun FTTH',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  DI_WAREHOUSE_GUDANG: {
    label: 'Warehouse Gudang',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  DIOPERASIONAL_PERUMAHAN_FTTH: {
    label: 'Operasional Perumahan FTTH',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  PINUS_LUAR: {
    label: 'Pinus Luar',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  },
  REPAIR: {
    label: 'Repair',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  TERPASANG_DI_PERUMAHAN: {
    label: 'Terpasang di Perumahan',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  TERPASANG_DI_RUSUN: {
    label: 'Terpasang di Rusun',
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
};

export function Inventory() {
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    Active: 1,
    Passive: 1,
    Tool: 1,
  });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productId: '',
    serialNumber: '',
    macAddress: '',
    status: 'GUDANG' as 'GUDANG' | 'TERPASANG' | 'RUSAK' | 'TEKNISI' | 'DI_OPERASIONAL_RUSUN_FTTH' | 'DI_WAREHOUSE_GUDANG' | 'DIOPERASIONAL_PERUMAHAN_FTTH' | 'PINUS_LUAR' | 'REPAIR' | 'TERPASANG_DI_PERUMAHAN' | 'TERPASANG_DI_RUSUN',
    purchaseDate: '',
    notes: '',
  });

  // Artacom sync states
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(
        `${API_URL}/api/items?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [statusFilter]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage({ Active: 1, Passive: 1, Tool: 1 });
  }, [searchQuery]);

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: '',
      serialNumber: '',
      macAddress: '',
      status: 'GUDANG',
      purchaseDate: '',
      notes: '',
    });
  };

  // Toggle section collapse
  const toggleSection = (category: string) => {
    setCollapsedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Filter items by category
  const filterItemsByCategory = (category: string) => {
    let filtered = items;

    // Filter by product category
    filtered = filtered.filter(item => item.product.category === category);

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.macAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Get stats for category
  const getCategoryStats = (category: string) => {
    const catItems = filterItemsByCategory(category);
    return {
      total: catItems.length,
      gudang: catItems.filter(i => i.status === 'GUDANG').length,
      terpasang: catItems.filter(i => i.status === 'TERPASANG').length,
      teknisi: catItems.filter(i => i.status === 'TEKNISI').length,
      rusak: catItems.filter(i => i.status === 'RUSAK').length,
    };
  };

  // Get paginated items
  const getPaginatedItems = (category: string) => {
    const catItems = filterItemsByCategory(category);
    const page = currentPage[category] || 1;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return catItems.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = (category: string) => {
    const catItems = filterItemsByCategory(category);
    return Math.ceil(catItems.length / ITEMS_PER_PAGE);
  };

  // Handle page change
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

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (item: ItemDetail) => {
    setSelectedItem(item);
    setFormData({
      productId: item.productId,
      serialNumber: item.serialNumber,
      macAddress: item.macAddress || '',
      status: item.status,
      purchaseDate: item.purchaseDate || '',
      notes: item.notes || '',
    });
    setEditDialogOpen(true);
  };

  // Open status dialog
  const openStatusDialog = (item: ItemDetail) => {
    setSelectedItem(item);
    setFormData(prev => ({ 
      ...prev, 
      status: item.status 
    }));
    setStatusDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (item: ItemDetail) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  // Open history dialog
  const openHistoryDialog = (item: ItemDetail) => {
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  // Create item
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: formData.productId,
          serialNumber: formData.serialNumber,
          macAddress: formData.macAddress || undefined,
          status: formData.status,
          purchaseDate: formData.purchaseDate || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        setAddDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal menambah item');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Gagal menambah item');
    }
  };

  // Update item
  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/items/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serialNumber: formData.serialNumber,
          macAddress: formData.macAddress || undefined,
          status: formData.status,
          purchaseDate: formData.purchaseDate || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setSelectedItem(null);
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal mengupdate item');
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Gagal mengupdate item');
    }
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/items/${selectedItem.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: formData.status,
        }),
      });

      if (response.ok) {
        setStatusDialogOpen(false);
        setSelectedItem(null);
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Gagal mengupdate status');
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/items/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        fetchItems();
      } else {
        alert('Gagal menghapus item');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Gagal menghapus item');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sync from Artacom
  const syncFromArtacom = async () => {
    setSyncLoading(true);
    setSyncMessage('');
    setSyncError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/artacom/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSyncMessage(result.message || 'Sync completed successfully');
        fetchItems(); // Refresh the items after sync
      } else {
        setSyncError(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError('Terjadi kesalahan saat sinkronisasi dari Artacom');
    } finally {
      setSyncLoading(false);
    }
  };

  // Download Excel Template for Inventory
  const handleDownloadTemplate = (category: string) => {
    // Data sheet
    const templateData = [
      {
        'SKU Produk': 'CONTOH-SKU-001',
        'Serial Number': 'SN123456789',
        'MAC Address': 'AA:BB:CC:DD:EE:FF',
        'Status': 'GUDANG',
        'Tanggal Pembelian (YYYY-MM-DD)': '2024-01-01',
        'Catatan': 'Contoh pengisian barang masuk',
      },
      {
        'SKU Produk': 'CONTOH-SKU-001',
        'Serial Number': 'SN987654321',
        'MAC Address': '11:22:33:44:55:66',
        'Status': 'TEKNISI',
        'Tanggal Pembelian (YYYY-MM-DD)': '2024-01-05',
        'Catatan': 'Barang dibawa teknisi',
      },
    ];

    // Instructions sheet
    const instructionData = [
      { 'Petunjuk Pengisian': '1. Kolom SKU Produk WAJIB sesuai dengan SKU yang terdaftar di Master Produk.' },
      { 'Petunjuk Pengisian': '2. Kolom Serial Number WAJIB unik dan tidak boleh duplikat di sistem.' },
      { 'Petunjuk Pengisian': '3. Kolom MAC Address bersifat OPSIONAL (boleh dikosongkan jika tidak ada).' },
      { 'Petunjuk Pengisian': '4. Kolom Status WAJIB diisi dengan salah satu dari: GUDANG, TERPASANG, RUSAK, atau TEKNISI.' },
      { 'Petunjuk Pengisian': '5. Kolom Tanggal Pembelian menggunakan format YYYY-MM-DD (Contoh: 2024-12-31).' },
      { 'Petunjuk Pengisian': '6. Hapus baris contoh sebelum melakukan import data Anda.' },
      { 'Petunjuk Pengisian': '' },
      { 'Petunjuk Pengisian': 'DAFTAR STATUS VALID:' },
      { 'Petunjuk Pengisian': '- GUDANG: Barang tersedia di gudang' },
      { 'Petunjuk Pengisian': '- TERPASANG: Barang sudah terpasang di pelanggan' },
      { 'Petunjuk Pengisian': '- RUSAK: Barang dalam kondisi rusak' },
      { 'Petunjuk Pengisian': '- TEKNISI: Barang sedang dibawa oleh teknisi' },
    ];

    const wb = XLSX.utils.book_new();
    
    // Create Import Sheet
    const wsImport = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, wsImport, 'Template Import');
    
    // Create Instruction Sheet
    const wsInfo = XLSX.utils.json_to_sheet(instructionData);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'PETUNJUK');

    XLSX.writeFile(wb, `Template_Import_Inventory_${category.replace(/\//g, '_')}.xlsx`);
    toast.success(`Template ${category} berhasil didownload`);
  };

  // Import Excel for Inventory
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const formattedItems = data.map((row: any) => ({
          productSku: row['SKU Produk']?.toString().trim(),
          serialNumber: row['Serial Number']?.toString().trim(),
          macAddress: row['MAC Address']?.toString().trim(),
          status: row['Status'] || 'GUDANG',
          purchaseDate: row['Tanggal Pembelian (YYYY-MM-DD)'],
          notes: row['Catatan'],
        }));

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/items/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: formattedItems }),
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
          fetchItems();
        } else {
          toast.error(result.error || 'Gagal mengimport data');
        }
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Gagal membaca file Excel');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory / Serial Number</h1>
          <p className="text-muted-foreground">Kelola item dengan serial number (ONT, Modem, dll)</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={syncFromArtacom} 
            className="gap-2"
            disabled={syncLoading}
          >
            {syncLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sinkronisasi...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Sinkron dari Artacom
              </>
            )}
          </Button>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Sync Status Message */}
      {(syncMessage || syncError) && (
        <Card className={syncError ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {syncError ? (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-green-500 mt-0.5 flex-shrink-0"></div>
              )}
              <div className="flex-1">
                <p className={syncError ? "text-red-800" : "text-green-800"}>
                  {syncError || syncMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari SN, MAC, atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="GUDANG">Gudang</SelectItem>
                <SelectItem value="TERPASANG">Terpasang</SelectItem>
                <SelectItem value="TEKNISI">Teknisi</SelectItem>
                <SelectItem value="RUSAK">Rusak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Sections */}
      {categories.map((category) => {
        const Icon = category.icon;
        const isCollapsed = collapsedSections[category.value];
        const catItems = filterItemsByCategory(category.value);
        const paginatedItems = getPaginatedItems(category.value);
        const stats = getCategoryStats(category.value);
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
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold text-blue-600">{stats.gudang}</p>
                    <p className="text-xs text-muted-foreground">Gudang</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold text-green-600">{stats.terpasang}</p>
                    <p className="text-xs text-muted-foreground">Terpasang</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold text-yellow-600">{stats.teknisi}</p>
                    <p className="text-xs text-muted-foreground">Teknisi</p>
                  </div>
                  {stats.rusak > 0 && (
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-red-600">{stats.rusak}</p>
                      <p className="text-xs text-muted-foreground">Rusak</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 border-l pl-4 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTemplate(category.label);
                      }}
                      title="Download Template Excel"
                    >
                      <Files className="h-4 w-4" />
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
                          onChange={(e) => handleImportExcel(e)}
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

            {/* Items Table */}
            {!isCollapsed && (
              <CardContent className="pt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : catItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Barcode className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'Tidak ada item ditemukan'
                        : `Tidak ada item di kategori ${category.label}`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>MAC Address</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal Pembelian</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead>Terakhir Update</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono font-medium">{item.serialNumber}</TableCell>
                              <TableCell className="font-mono">{item.macAddress || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{item.product.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn('border', statusConfig[item.status].color)}>
                                  {statusConfig[item.status].label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.purchaseDate ? formatDate(item.purchaseDate) : '-'}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{item.notes || '-'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(item.updatedAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openHistoryDialog(item)}
                                    title="Lihat Histori"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openStatusDialog(item)}
                                    title="Ubah Status"
                                  >
                                    <MapPin className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(item)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(item)}
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
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
                          Menampilkan {(currentPageNum - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPageNum * ITEMS_PER_PAGE, catItems.length)} dari {catItems.length} item
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
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Item Baru</DialogTitle>
            <DialogDescription>
              Register item baru dengan serial number
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produk *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div key={cat.value}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {cat.label}
                        </div>
                        {products
                          .filter(p => p.category === cat.value)
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id} className="pl-6">
                              {product.sku} - {product.name}
                            </SelectItem>
                          ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn">Serial Number *</Label>
              <Input
                id="sn"
                placeholder="Contoh: ZTEG12345678"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mac">MAC Address</Label>
              <Input
                id="mac"
                placeholder="Contoh: AA:BB:CC:DD:EE:FF"
                value={formData.macAddress}
                onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-add">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger id="status-add">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUDANG">Gudang</SelectItem>
                  <SelectItem value="TERPASANG">Terpasang</SelectItem>
                  <SelectItem value="RUSAK">Rusak</SelectItem>
                  <SelectItem value="TEKNISI">Teknisi</SelectItem>
                  <SelectItem value="DI_OPERASIONAL_RUSUN_FTTH">Di Operasional Rusun FTTH</SelectItem>
                  <SelectItem value="DI_WAREHOUSE_GUDANG">Di Warehouse Gudang</SelectItem>
                  <SelectItem value="DIOPERASIONAL_PERUMAHAN_FTTH">Dioperasional Perumahan FTTH</SelectItem>
                  <SelectItem value="PINUS_LUAR">Pinus Luar</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="TERPASANG_DI_PERUMAHAN">Terpasang di Perumahan</SelectItem>
                  <SelectItem value="TERPASANG_DI_RUSUN">Terpasang di Rusun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-date">Tanggal Pembelian</Label>
              <Input
                id="purchase-date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                placeholder="Catatan opsional"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={!formData.productId || !formData.serialNumber}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Edit informasi item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sn">Serial Number *</Label>
              <Input
                id="edit-sn"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mac">MAC Address</Label>
              <Input
                id="edit-mac"
                placeholder="Contoh: AA:BB:CC:DD:EE:FF"
                value={formData.macAddress}
                onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-edit">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger id="status-edit">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUDANG">Gudang</SelectItem>
                  <SelectItem value="TERPASANG">Terpasang</SelectItem>
                  <SelectItem value="RUSAK">Rusak</SelectItem>
                  <SelectItem value="TEKNISI">Teknisi</SelectItem>
                  <SelectItem value="DI_OPERASIONAL_RUSUN_FTTH">Di Operasional Rusun FTTH</SelectItem>
                  <SelectItem value="DI_WAREHOUSE_GUDANG">Di Warehouse Gudang</SelectItem>
                  <SelectItem value="DIOPERASIONAL_PERUMAHAN_FTTH">Dioperasional Perumahan FTTH</SelectItem>
                  <SelectItem value="PINUS_LUAR">Pinus Luar</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="TERPASANG_DI_PERUMAHAN">Terpasang di Perumahan</SelectItem>
                  <SelectItem value="TERPASANG_DI_RUSUN">Terpasang di Rusun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-purchase-date">Tanggal Pembelian</Label>
              <Input
                id="edit-purchase-date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Catatan</Label>
              <Input
                id="edit-notes"
                placeholder="Catatan opsional"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdate}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ubah Status Item</DialogTitle>
            <DialogDescription>
              {selectedItem && `SN: ${selectedItem.serialNumber}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUDANG">Gudang</SelectItem>
                  <SelectItem value="TERPASANG">Terpasang</SelectItem>
                  <SelectItem value="TEKNISI">Teknisi</SelectItem>
                  <SelectItem value="RUSAK">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Item</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus item ini?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Serial Number:</span> {selectedItem.serialNumber}
              </div>
              <div className="text-sm">
                <span className="font-medium">Produk:</span> {selectedItem.product.name}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Histori Item
            </DialogTitle>
            <DialogDescription>
              {selectedItem && `SN: ${selectedItem.serialNumber} - ${selectedItem.product.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              <ItemTimeline itemId={selectedItem.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
