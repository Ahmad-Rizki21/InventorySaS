import { useState, useEffect, useRef } from 'react';
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
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Barcode,
  Search,
  Camera,
  CameraOff,
  CheckCircle2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  MapPin,
  Package,
  Cable,
  Wrench,
  Filter,
  X,
  Eye,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { ItemTimeline } from '../components/ItemTimeline';

const categories = [
  { value: 'all', label: 'Semua Kategori', icon: Package },
  { value: 'Active', label: 'ONT / Active', icon: Package },
  { value: 'Passive', label: 'Kabel / Passive', icon: Cable },
  { value: 'Tool', label: 'Tools', icon: Wrench },
];

const statusConfig = {
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
};

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
  status: 'GUDANG' | 'TERPASANG' | 'RUSAK' | 'TEKNISI';
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  notes: string | null;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  timestamp: string;
  serialNumber: string;
  productName: string;
  oldStatus: string;
  newStatus: string;
  notes?: string;
}

export function Audit() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundItem, setFoundItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [location, setLocation] = useState({ lat: null as number | null, lng: null as number | null });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [allItems, setAllItems] = useState<ItemDetail[]>([]);

  // Selected item for history view
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<ItemDetail | null>(null);

  // Export filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanRegionId = 'qr-reader';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  };

  // Search item by SN
  const searchItem = async (sn: string) => {
    setLoading(true);
    setFoundItem(null);

    try {
      const token = localStorage.getItem('token');
      // Use the correct scan endpoint
      const response = await fetch(`${API_URL}/api/items?search=${encodeURIComponent(sn)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const items = await response.json();
        if (items && items.length > 0) {
          const item = items[0];
          setFoundItem(item);
          setNewStatus(item.status);
          getCurrentLocation();
        } else {
          setFoundItem(null);
          alert('Item tidak ditemukan!');
        }
      } else {
        setFoundItem(null);
        alert('Item tidak ditemukan!');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Gagal mencari item');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchItem(searchQuery.trim());
    }
  };

  // Start scanner
  const startScanner = async () => {
    setScannerOpen(true);

    try {
      const scanner = new Html5Qrcode(scanRegionId);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {
          // Scan error, ignore
        }
      );
    } catch (error) {
      console.error('Scanner error:', error);
      alert('Gagal mengakses kamera. Pastikan izin kamera aktif.');
      stopScanner();
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.log('Scanner stop error:', error);
      }
      scannerRef.current = null;
    }
    setScannerOpen(false);
  };

  // Scan success
  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    setSearchQuery(decodedText);
    await searchItem(decodedText);
  };

  // Update status
  const updateStatus = async () => {
    if (!foundItem || !newStatus) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/items/${foundItem.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          lastKnownLat: location.lat,
          lastKnownLng: location.lng,
        }),
      });

      if (response.ok) {
        const log: AuditLog = {
          timestamp: new Date().toISOString(),
          serialNumber: foundItem.serialNumber,
          productName: foundItem.product.name,
          oldStatus: foundItem.status,
          newStatus: newStatus,
          notes: auditNotes || undefined,
        };
        setAuditLogs([log, ...auditLogs]);

        const updatedItem = { 
          ...foundItem, 
          status: newStatus as 'GUDANG' | 'TERPASANG' | 'RUSAK' | 'TEKNISI' 
        };
        setFoundItem(updatedItem);

        alert(`Status berhasil diupdate ke ${statusConfig[newStatus as keyof typeof statusConfig].label}!`);
        setAuditNotes('');
      } else {
        alert('Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Gagal mengupdate status');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all items for export
  const fetchAllItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const items = await response.json();
        setAllItems(items);
        return items;
      }
      return [];
    } catch (error) {
      console.error('Fetch failed:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Export Audit Log to Excel
  const exportAuditToExcel = () => {
    if (auditLogs.length === 0) {
      alert('Belum ada data audit untuk diexport');
      return;
    }

    const data = auditLogs.map(log => ({
      'Waktu': new Date(log.timestamp).toLocaleString('id-ID'),
      'Serial Number': log.serialNumber,
      'Produk': log.productName,
      'Status Lama': log.oldStatus,
      'Status Baru': log.newStatus,
      'Catatan': log.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key as keyof typeof row]).length))
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Audit-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Inventory to Excel with filters
  const exportInventoryToExcel = async () => {
    const items = await fetchAllItems();

    // Apply filters
    let filteredItems = items;
    if (filterCategory !== 'all') {
      filteredItems = filteredItems.filter((item: ItemDetail) => item.product.category === filterCategory);
    }
    if (filterStatus !== 'all') {
      filteredItems = filteredItems.filter((item: ItemDetail) => item.status === filterStatus);
    }

    if (filteredItems.length === 0) {
      alert('Tidak ada data untuk diexport dengan filter ini');
      return;
    }

    const data = filteredItems.map((item: ItemDetail) => ({
      'Serial Number': item.serialNumber,
      'MAC Address': item.macAddress || '',
      'Produk': item.product.name,
      'SKU': item.product.sku,
      'Kategori': item.product.category,
      'Status': item.status,
      'Catatan': item.notes || '',
      'Terakhir Update': new Date(item.updatedAt).toLocaleString('id-ID'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key as keyof typeof row]).length))
    }));
    ws['!cols'] = colWidths;

    // Add filter to header
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'] || 'A1')) };

    XLSX.writeFile(wb, `Inventory-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportDialogOpen(false);
  };

  // Open history dialog
  const openHistoryDialog = (item: ItemDetail) => {
    setSelectedItemForHistory(item);
    setHistoryDialogOpen(true);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || Package;
  };

  // Count items by status for export dialog
  const getItemCounts = () => {
    let total = allItems.length;
    let gudang = allItems.filter(i => i.status === 'GUDANG').length;
    let terpasang = allItems.filter(i => i.status === 'TERPASANG').length;
    let teknisi = allItems.filter(i => i.status === 'TEKNISI').length;
    let rusak = allItems.filter(i => i.status === 'RUSAK').length;

    // Apply category filter
    if (filterCategory !== 'all') {
      const categoryItems = allItems.filter(i => i.product.category === filterCategory);
      total = categoryItems.length;
      gudang = categoryItems.filter(i => i.status === 'GUDANG').length;
      terpasang = categoryItems.filter(i => i.status === 'TERPASANG').length;
      teknisi = categoryItems.filter(i => i.status === 'TEKNISI').length;
      rusak = categoryItems.filter(i => i.status === 'RUSAK').length;
    }

    return { total, gudang, terpasang, teknisi, rusak };
  };

  const counts = getItemCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit / Scan</h1>
          <p className="text-muted-foreground">Scan dan audit barang dengan QR/Barcode</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchAllItems(); setExportDialogOpen(true); }}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Inventory
          </Button>
          <Button onClick={exportAuditToExcel} disabled={auditLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Audit ({auditLogs.length})
          </Button>
        </div>
      </div>

      {/* Scanner & Search */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Card */}
        <Card className={cn(scannerOpen ? 'border-primary' : '')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              QR/Barcode Scanner
            </CardTitle>
            <CardDescription>
              Scan QR code atau barcode item menggunakan kamera
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!scannerOpen ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Camera className="h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Klik tombol di bawah untuk membuka kamera dan scan QR/Barcode
                </p>
                <Button onClick={startScanner} className="w-full max-w-xs">
                  <Camera className="h-4 w-4 mr-2" />
                  Buka Scanner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div id={scanRegionId} className="rounded-lg overflow-hidden" />
                <Button onClick={stopScanner} variant="destructive" className="w-full">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Tutup Scanner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pencarian Manual
            </CardTitle>
            <CardDescription>
              Cari item berdasarkan Serial Number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan Serial Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="font-mono uppercase"
                />
                <Button onClick={handleSearch} disabled={loading || !searchQuery}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {location.lat && location.lng && (
                <div className="text-xs text-muted-foreground">
                  📍 Lokasi terdeteksi: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Found Item Details */}
      {foundItem && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Item Ditemukan!
            </CardTitle>
            <CardDescription>
              Serial Number: <span className="font-mono font-semibold">{foundItem.serialNumber}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Item Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informasi Item</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produk</span>
                    <span className="font-medium flex items-center gap-1">
                      {(() => {
                        const Icon = getCategoryIcon(foundItem.product.category);
                        return <Icon className="h-4 w-4" />;
                      })()}
                      {foundItem.product.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-mono">{foundItem.product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MAC Address</span>
                    <span className="font-mono">{foundItem.macAddress || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kategori</span>
                    <Badge variant="outline">{foundItem.product.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Saat Ini</span>
                    <Badge className={cn('border', statusConfig[foundItem.status].color)}>
                      {statusConfig[foundItem.status].label}
                    </Badge>
                  </div>
                  {foundItem.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catatan</span>
                      <span>{foundItem.notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terakhir Update</span>
                    <span className="text-sm">
                      {new Date(foundItem.updatedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aksi</span>
                    <Button variant="outline" size="sm" onClick={() => openHistoryDialog(foundItem)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat Histori
                    </Button>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div className="space-y-4">
                <h3 className="font-semibold">Update Status Audit</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status Baru</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label>Catatan Audit (Opsional)</Label>
                    <Input
                      placeholder="Contoh: Ditemukan di gudang A, kondisi baik"
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={updateStatus}
                    disabled={loading || newStatus === foundItem.status}
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    Update Status & Lokasi
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Audit Sesi Ini</CardTitle>
            <CardDescription>
              {auditLogs.length} item diaudit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Waktu</th>
                    <th className="text-left p-2">Serial Number</th>
                    <th className="text-left p-2">Produk</th>
                    <th className="text-left p-2">Status Lama</th>
                    <th className="text-left p-2">Status Baru</th>
                    <th className="text-left p-2">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="p-2 font-mono">{log.serialNumber}</td>
                      <td className="p-2">{log.productName}</td>
                      <td className="p-2">
                        <Badge variant="outline">{log.oldStatus}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={cn('border', statusConfig[log.newStatus as keyof typeof statusConfig]?.color)}>
                          {statusConfig[log.newStatus as keyof typeof statusConfig]?.label || log.newStatus}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">{log.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export Inventory ke Excel
            </DialogTitle>
            <DialogDescription>
              Pilih filter untuk data yang akan diexport
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-2 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xl font-bold">{counts.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{counts.gudang}</div>
                <div className="text-xs text-muted-foreground">Gudang</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{counts.terpasang}</div>
                <div className="text-xs text-muted-foreground">Terpasang</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{counts.teknisi}</div>
                <div className="text-xs text-muted-foreground">Teknisi</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{counts.rusak}</div>
                <div className="text-xs text-muted-foreground">Rusak</div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Filter Kategori</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Selected filters display */}
              {(filterCategory !== 'all' || filterStatus !== 'all') && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm">Filter aktif:</span>
                  {filterCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {categories.find(c => c.value === filterCategory)?.label}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCategory('all')} />
                    </Badge>
                  )}
                  {filterStatus !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filterStatus}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={exportInventoryToExcel} disabled={loading || counts.total === 0}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Excel ({counts.total} items)
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
              {selectedItemForHistory && `SN: ${selectedItemForHistory.serialNumber} - ${selectedItemForHistory.product.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedItemForHistory && (
            <div className="py-4">
              <ItemTimeline itemId={selectedItemForHistory.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
