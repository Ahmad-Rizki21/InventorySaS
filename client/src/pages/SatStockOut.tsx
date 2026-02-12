import { useState } from 'react';
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
import { Search, ArrowUpFromLine, RefreshCw, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

export function SatStockOut() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    status: 'TERPASANG',
    idToko: '',
    namaToko: '',
    dc: '',
    brandToko: 'Alfamart',
    tglKirimMitra: new Date().toISOString().split('T')[0],
    mitra: '',
    notes: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const searchItems = async () => {
    if (!searchQuery) return;
    try {
      const token = localStorage.getItem('token');
      // Remove status=GUDANG filter to find items regardless of status
      const response = await fetch(`${API_URL}/api/sat/items?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFoundItems(data);
      }
    } catch (error) {
      toast.error('Gagal mencari item');
    }
  };

  const addItem = (item: any) => {
    if (item.status !== 'GUDANG') return; // Prevent adding non-GUDANG items
    if (selectedItems.find(i => i.id === item.id)) return toast.error('Item sudah dipilih');
    setSelectedItems([...selectedItems, item]);
    setSearchQuery('');
    setFoundItems([]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return toast.error('Pilih minimal satu item');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/stock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemIds: selectedItems.map(i => i.id),
          ...formData
        }),
      });

      if (response.ok) {
        toast.success('Stock Out SAT berhasil diproses');
        setSelectedItems([]);
        setFormData({
          status: 'TERPASANG', idToko: '', namaToko: '', dc: '', brandToko: 'Alfamart',
          tglKirimMitra: new Date().toISOString().split('T')[0], mitra: '', notes: ''
        });
      } else {
        const err = await response.json();
        toast.error(err.error || 'Gagal proses Stock Out');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Out SAT</h1>
        <p className="text-muted-foreground">Pengiriman unit SAT ke Toko atau Mitra</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cari Unit di Gudang</CardTitle>
              <CardDescription>Cari berdasarkan Serial Number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Masukkan Serial Number..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchItems()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={searchItems} variant="secondary">Cari</Button>
              </div>

              {foundItems.length > 0 && (
                <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                  {foundItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-3 flex items-center justify-between transition-colors ${
                        item.status === 'GUDANG' 
                          ? 'hover:bg-accent cursor-pointer' 
                          : 'bg-muted/30 opacity-70 cursor-not-allowed'
                      }`}
                      onClick={() => item.status === 'GUDANG' && addItem(item)}
                    >
                      <div>
                        <p className="font-mono text-sm font-bold">{item.serialNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{item.product.name}</p>
                          {item.status !== 'GUDANG' && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1 py-0 pointer-events-none">
                              {item.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {item.status === 'GUDANG' ? (
                        <Button size="sm" variant="ghost">Pilih</Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium px-3">
                          Tidak tersedia
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">Unit Terpilih ({selectedItems.length})</Label>
                  {selectedItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])} className="h-7 text-xs text-red-500">Hapus Semua</Button>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mb-1 opacity-50" />
                      <p className="text-xs">Belum ada unit dipilih</p>
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {selectedItems.map(item => (
                        <div key={item.id} className="bg-card border rounded p-2 flex items-center justify-between">
                          <div className="text-sm">
                            <p className="font-mono font-bold">{item.serialNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{item.product.name}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Destination Details */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpFromLine className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
              Detail Pengiriman SAT
            </CardTitle>
            <CardDescription>Tentukan tujuan dan status unit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status Baru *</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERPASANG">Terpasang</SelectItem>
                    <SelectItem value="TEKNISI">Teknisi</SelectItem>
                    <SelectItem value="MIGRASI">Migrasi</SelectItem>
                    <SelectItem value="PROSES_INSTALASI">Proses Instalasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand Toko</Label>
                <Select value={formData.brandToko} onValueChange={(v) => setFormData({...formData, brandToko: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alfamart">Alfamart</SelectItem>
                    <SelectItem value="Lawson">Lawson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Toko</Label>
                <Input value={formData.idToko} onChange={(e) => setFormData({...formData, idToko: e.target.value})} placeholder="OA36" />
              </div>
              <div className="space-y-2">
                <Label>DC</Label>
                <Input value={formData.dc} onChange={(e) => setFormData({...formData, dc: e.target.value})} placeholder="KLATEN" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Toko</Label>
              <Input value={formData.namaToko} onChange={(e) => setFormData({...formData, namaToko: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tgl Kirim Mitra</Label>
                <Input type="date" value={formData.tglKirimMitra} onChange={(e) => setFormData({...formData, tglKirimMitra: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mitra</Label>
                <Input value={formData.mitra} onChange={(e) => setFormData({...formData, mitra: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>

            <Button 
              className="w-full gap-2 mt-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg h-10" 
              onClick={handleSubmit} 
              disabled={loading || selectedItems.length === 0}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />}
              Proses Stock Out SAT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
