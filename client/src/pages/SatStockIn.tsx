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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, ArrowDownToLine, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSat {
  id: string;
  sku: string;
  name: string;
}

export function SatStockIn() {
  const [products, setProducts] = useState<ProductSat[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([
    { productSatId: '', serialNumber: '', milikPerangkat: 'ARTACOM', tglTerimaGudang: new Date().toISOString().split('T')[0] }
  ]);
  const [globalNotes, setGlobalNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [stockData, setStockData] = useState<any[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/sat/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
      setStockData(data); // Using products as stock data since it has counts
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addItemRow = () => {
    setItems([...items, { productSatId: '', serialNumber: '', milikPerangkat: 'ARTACOM', tglTerimaGudang: new Date().toISOString().split('T')[0] }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setItems([{ productSatId: '', serialNumber: '', milikPerangkat: 'ARTACOM', tglTerimaGudang: new Date().toISOString().split('T')[0] }]);
    setGlobalNotes('');
  };

  const updateItemRow = (index: number, field: string, value: string) => {
    const newItems = [...items];
    let val = value;
    if (field === 'serialNumber') val = value.trim().toUpperCase();
    newItems[index][field] = val;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (items.length === 0) return toast.error('Tambahkan minimal satu item');
    
    // Check for duplicates within the current list
    const serials = items.map(i => i.serialNumber.trim().toUpperCase());
    const hasDuplicates = serials.some((sn, idx) => serials.indexOf(sn) !== idx);
    if (hasDuplicates) {
      return toast.error('Ada Serial Number duplikat di dalam daftar input');
    }

    // Check for empty fields
    const hasEmpty = items.some(i => !i.productSatId || !i.serialNumber);
    if (hasEmpty) {
      return toast.error('Semua kolom bertanda * harus diisi');
    }

    // NEW: Check against existing data in the DB (that we've already loaded in stockData or products)
    // Actually, we need to check if the serial number is already in the 'item_sat' table.
    // Since stockData only has counts, we might need a separate API to check SNs or just rely on the server error.
    // However, the server error IS working (as seen in user logs).
    // I'll just make the error handling more robust.
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sat/stock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items, notes: globalNotes }),
      });

      if (response.ok) {
        toast.success('Stock In SAT berhasil diproses');
        setItems([]);
        setGlobalNotes('');
        fetchProducts(); // Refresh stock data
      } else {
        const err = await response.json();
        toast.error(err.error || 'Gagal proses Stock In');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock In SAT</h1>
        <p className="text-muted-foreground">Tambah stok unit SAT ke gudang</p>
      </div>

      {/* Stock In Form */}
      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-green-600" />
            Form Stock In
          </CardTitle>
          <CardDescription>Tambah stok unit SAT ke gudang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Form Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produk *</Label>
                <Select 
                  value={items[0]?.productSatId || ''} 
                  onValueChange={(v) => {
                    if (items.length === 0) {
                      setItems([{ productSatId: v, serialNumber: '', milikPerangkat: 'ARTACOM', tglTerimaGudang: new Date().toISOString().split('T')[0] }]);
                    } else {
                      updateItemRow(0, 'productSatId', v);
                    }
                  }}
                >
                  <SelectTrigger id="product">
                    <span className="truncate">
                      {items[0]?.productSatId ? (
                        products.find(p => p.id === items[0].productSatId) ? (
                          `${products.find(p => p.id === items[0].productSatId)?.sku} - ${products.find(p => p.id === items[0].productSatId)?.name}`
                        ) : "Pilih produk"
                      ) : <span className="text-muted-foreground">Pilih produk</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-bold">{p.sku}</span> - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="serialNumber"
                    type="text"
                    placeholder="Masukkan serial number"
                    value={items[0]?.serialNumber || ''}
                    onChange={(e) => {
                      if (items.length === 0) {
                        setItems([{ productSatId: '', serialNumber: e.target.value.trim().toUpperCase(), milikPerangkat: 'ARTACOM', tglTerimaGudang: new Date().toISOString().split('T')[0] }]);
                      } else {
                        updateItemRow(0, 'serialNumber', e.target.value);
                      }
                    }}
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="milik">Milik Perangkat</Label>
                <Select 
                  value={items[0]?.milikPerangkat || 'ARTACOM'} 
                  onValueChange={(v) => {
                    if (items.length === 0) {
                      setItems([{ productSatId: '', serialNumber: '', milikPerangkat: v, tglTerimaGudang: new Date().toISOString().split('T')[0] }]);
                    } else {
                      updateItemRow(0, 'milikPerangkat', v);
                    }
                  }}
                >
                  <SelectTrigger id="milik">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSTEL">TRANSTEL</SelectItem>
                    <SelectItem value="JEDI">JEDI</SelectItem>
                    <SelectItem value="ORIX">ORIX</SelectItem>
                    <SelectItem value="ARTACOM">ARTACOM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={addItemRow} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  disabled={!items[0]?.productSatId || !items[0]?.serialNumber}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Baris
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    if (items.length > 0 && items[0].productSatId) {
                      const newItems = items.map(item => ({ ...item, productSatId: items[0].productSatId }));
                      setItems(newItems);
                      toast.info('Semua perangkat disamakan');
                    }
                  }}
                  disabled={items.length < 2 || !items[0]?.productSatId}
                >
                  Set Semua
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tgl Terima & Catatan</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input 
                    type="date" 
                    value={items[0]?.tglTerimaGudang || new Date().toISOString().split('T')[0]} 
                    onChange={(e) => {
                      const newItems = items.map(item => ({ ...item, tglTerimaGudang: e.target.value }));
                      setItems(newItems);
                    }} 
                  />
                  <Input 
                    value={globalNotes} 
                    onChange={(e) => setGlobalNotes(e.target.value)} 
                    placeholder="Catatan pengiriman..."
                  />
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading || items.length === 0} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Stok
                  </>
                )}
              </Button>
            </div>

            {/* Preview Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Preview</h3>

              {items[0]?.productSatId ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produk</span>
                    <span className="font-medium">{products.find(p => p.id === items[0].productSatId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-mono text-sm">{products.find(p => p.id === items[0].productSatId)?.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Batch</span>
                    <span className="font-medium">{items.length} Unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Milik</span>
                    <span className="font-medium">{items[0].milikPerangkat}</span>
                  </div>
                  {items[0].serialNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial Number</span>
                      <span className="font-mono text-sm font-bold">{items[0].serialNumber}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Akan Ditambah</span>
                      <span className="font-bold text-lg text-green-600">
                        +{items.length} Unit
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <ArrowDownToLine className="h-12 w-12 mb-2 opacity-50" />
                  <p>Pilih produk untuk melihat preview</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List (if more than 1) */}
      {items.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Daftar Unit ({items.length})</CardTitle>
                <CardDescription>Unit yang akan ditambahkan ke stok</CardDescription>
              </div>
              <Button onClick={resetForm} variant="outline" size="sm" className="gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
                Reset Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-md border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Perangkat</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Milik</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{products.find(p => p.id === item.productSatId)?.sku}</span>
                          <span className="text-[10px] text-muted-foreground">{products.find(p => p.id === item.productSatId)?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold">{item.serialNumber}</TableCell>
                      <TableCell>{item.milikPerangkat}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItemRow(index)} className="h-8 w-8 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Stocks Table (Matches FTTH) */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Stok SAT Saat Ini</CardTitle>
              <CardDescription>Ringkasan unit per produk</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-center">Total Unit</TableHead>
                  <TableHead className="text-center">Tersedia</TableHead>
                  <TableHead className="text-center">Terpasang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockData.filter(s => 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.sku.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Data tidak ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  stockData
                    .filter(s => 
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      s.sku.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-mono text-sm">{stock.sku}</TableCell>
                        <TableCell className="font-medium">{stock.name}</TableCell>
                        <TableCell className="text-center font-bold font-mono">{stock.itemCount}</TableCell>
                        <TableCell className="text-center text-blue-600 font-bold font-mono">{stock.availableItems}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold font-mono">{stock.deployedItems}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
