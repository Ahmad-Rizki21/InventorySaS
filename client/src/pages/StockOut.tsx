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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  ArrowUpFromLine,
  Package,
  Minus,
  Search,
  RefreshCw,
  AlertTriangle,
  Cable,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';

const categories = [
  { value: 'Active', label: 'ONT / Active', icon: Package },
  { value: 'Passive', label: 'Kabel / Passive', icon: Cable },
  { value: 'Tool', label: 'Tools', icon: Wrench },
];

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  totalStock: number;
}

interface StockRecord {
  id: string;
  productId: string;
  quantity: number;
  warehouseId: string;
  product: Product;
  updatedAt: string;
}

export function StockOut() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // Fetch stocks
  const fetchStocks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/stocks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStocks();
  }, []);

  // Handle stock out
  const handleStockOut = async () => {
    if (!selectedProductId || !quantity || parseFloat(quantity) <= 0) {
      alert('Pilih produk dan masukkan jumlah yang valid');
      return;
    }

    const currentStock = getCurrentStock(selectedProductId);
    if (parseFloat(quantity) > currentStock) {
      alert('Jumlah melebihi stok yang tersedia!');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/stocks/out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: parseFloat(quantity),
          warehouseId: 'WH-001',
        }),
      });

      if (response.ok) {
        // Reset form
        setSelectedProductId('');
        setQuantity('');
        setNotes('');
        // Refresh data
        await Promise.all([fetchProducts(), fetchStocks()]);
        alert('Stok berhasil dikurangi!');
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal mengurangi stok');
      }
    } catch (error) {
      console.error('Failed to stock out:', error);
      alert('Gagal mengurangi stok');
    } finally {
      setLoading(false);
    }
  };

  // Get current stock for product
  const getCurrentStock = (productId: string) => {
    const stock = stocks.find(s => s.productId === productId);
    return stock ? stock.quantity : 0;
  };

  // Get selected product
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const currentStock = selectedProductId ? getCurrentStock(selectedProductId) : 0;
  const quantityNum = parseFloat(quantity) || 0;
  const remainingStock = currentStock - quantityNum;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Out</h1>
        <p className="text-muted-foreground">Keluarkan stok barang dari gudang</p>
      </div>

      {/* Stock Out Form */}
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-orange-600" />
            Form Stock Out
          </CardTitle>
          <CardDescription>Keluarkan stok barang dari gudang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Product Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produk *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product">
                    <span className="truncate">
                      {selectedProductId ? (
                        products.find(p => p.id === selectedProductId) ? (
                          `${products.find(p => p.id === selectedProductId)?.sku} - ${products.find(p => p.id === selectedProductId)?.name}`
                        ) : "Pilih produk"
                      ) : <span className="text-muted-foreground">Pilih produk</span>}
                    </span>
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
                            .map((product) => {
                              const stock = getCurrentStock(product.id);
                              return (
                                <SelectItem
                                  key={product.id}
                                  value={product.id}
                                  className="pl-6"
                                  disabled={stock === 0}
                                >
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <span className={stock === 0 ? 'text-muted-foreground' : ''}>
                                      {product.sku} - {product.name}
                                    </span>
                                    <Badge
                                      variant={stock === 0 ? 'destructive' : 'outline'}
                                      className="ml-auto"
                                    >
                                      {stock} {product.unit}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Masukkan jumlah"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    max={currentStock}
                  />
                  {selectedProduct && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {selectedProduct.unit}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Maksimal: {currentStock} {selectedProduct.unit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Input
                  id="notes"
                  placeholder="Contoh: Untuk teknisi Budi, Pelanggan Pak Ahmad"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                onClick={handleStockOut}
                disabled={!selectedProductId || !quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > currentStock || loading}
                className="w-full"
                variant={parseFloat(quantity) > currentStock ? 'destructive' : 'default'}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Minus className="h-4 w-4 mr-2" />
                )}
                Kurangi Stok
              </Button>
            </div>

            {/* Preview */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Preview</h3>

              {selectedProduct ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produk</span>
                    <span className="font-medium">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-mono text-sm">{selectedProduct.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stok Saat Ini</span>
                    <span className="font-medium">{currentStock} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Akan Dikeluarkan</span>
                    <span className="font-medium text-orange-600">
                      -{quantity || 0} {selectedProduct.unit}
                    </span>
                  </div>

                  {/* Warning if insufficient stock */}
                  {quantityNum > currentStock && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">Stok tidak mencukupi!</span>
                    </div>
                  )}

                  {/* Warning if low stock */}
                  {quantityNum <= currentStock && remainingStock < 10 && remainingStock >= 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-yellow-600 text-sm">
                        Sisa stok akan rendah: {remainingStock} {selectedProduct.unit}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Sisa Stok</span>
                      <span className={cn(
                        'font-bold text-lg',
                        remainingStock < 10 ? 'text-red-600' : remainingStock < 20 ? 'text-yellow-600' : ''
                      )}>
                        {Math.max(0, remainingStock)} {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p>Pilih produk untuk melihat preview</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Stocks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stok Saat Ini</CardTitle>
              <CardDescription>
                Total {stocks.length} produk terdaftar
                {stocks.filter(s => s.quantity < 10).length > 0 && (
                  <span className="ml-2 text-red-600">
                    ({stocks.filter(s => s.quantity < 10).length} barang stok rendah)
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStocks}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada stok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks
                    .filter(stock => {
                      if (!searchQuery) return true;
                      const product = stock.product;
                      return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
                    })
                    .map((stock) => {
                      const product = stock.product;
                      const category = categories.find(c => c.value === product.category);
                      const Icon = category?.icon || Package;
                      const isLowStock = stock.quantity < 10;
                      const isOutOfStock = stock.quantity === 0;

                      return (
                        <TableRow key={stock.id} className={isOutOfStock ? 'bg-red-500/5' : ''}>
                          <TableCell className="font-mono font-medium">{product.sku}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {product.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              'font-bold text-lg',
                              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : ''
                            )}>
                              {stock.quantity.toLocaleString()} {product.unit}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isOutOfStock ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-yellow-500 text-yellow-950">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-green-500">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(stock.updatedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
