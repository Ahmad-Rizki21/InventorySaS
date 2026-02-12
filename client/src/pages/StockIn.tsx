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
  ArrowDownToLine,
  Package,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
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

export function StockIn() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

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

  // Handle stock in
  const handleStockIn = async () => {
    if (!selectedProductId || !quantity || parseFloat(quantity) <= 0) {
      alert('Pilih produk dan masukkan jumlah yang valid');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/stocks/in`, {
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
        // Refresh data
        await Promise.all([fetchProducts(), fetchStocks()]);
        alert('Stok berhasil ditambahkan!');
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal menambah stok');
      }
    } catch (error) {
      console.error('Failed to stock in:', error);
      alert('Gagal menambah stok');
    } finally {
      setLoading(false);
    }
  };

  // Get current stock for product
  const getCurrentStock = (productId: string) => {
    const stock = stocks.find(s => s.productId === productId);
    return stock ? stock.quantity : 0;
  };

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected product
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const currentStock = selectedProductId ? getCurrentStock(selectedProductId) : 0;

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
        <h1 className="text-3xl font-bold tracking-tight">Stock In</h1>
        <p className="text-muted-foreground">Tambah stok barang ke gudang</p>
      </div>

      {/* Stock In Form */}
      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-green-600" />
            Form Stock In
          </CardTitle>
          <CardDescription>Tambah stok barang ke gudang</CardDescription>
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
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id} className="pl-6">
                                <div className="flex items-center justify-between w-full gap-4">
                                  <span>{product.sku} - {product.name}</span>
                                  <Badge variant="outline" className="ml-auto">
                                    {getCurrentStock(product.id)} {product.unit}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
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
                  />
                  {selectedProduct && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {selectedProduct.unit}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleStockIn}
                disabled={!selectedProductId || !quantity || loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Tambah Stok
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
                    <span className="text-muted-foreground">Akan Ditambah</span>
                    <span className="font-medium text-green-600">
                      +{quantity || 0} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Stok Setelah</span>
                      <span className="font-bold text-lg">
                        {currentStock + (parseFloat(quantity) || 0)} {selectedProduct.unit}
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
              <CardDescription>Total {stocks.length} produk terdaftar</CardDescription>
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

                      return (
                        <TableRow key={stock.id}>
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
                            <span className="font-bold text-lg">
                              {stock.quantity.toLocaleString()} {product.unit}
                            </span>
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
