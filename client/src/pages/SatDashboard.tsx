import { useState, useEffect } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Truck,
  Store,
  History,
  Boxes,
  RadioIcon,
  Warehouse
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface SatStats {
  totalUnits: number;
  statusCounts: Record<string, number>;
  brandCounts: Array<{ brandToko: string; _count: number }>;
  recentItems: any[];
}

export function SatDashboard() {
  const [stats, setStats] = useState<SatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/sat/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8 pt-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard SAT</h1>
        <p className="text-muted-foreground">Ringkasan inventory gudang SAT</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Unit SAT"
          value={stats?.totalUnits ?? 0}
          icon={Boxes}
          description="Semua perangkat Peplink"
          isLoading={loading}
        />
        <StatsCard
          title="Unit Terpasang"
          value={stats?.statusCounts['TERPASANG'] ?? 0}
          icon={RadioIcon}
          description="Aktif di lokasi toko"
          isLoading={loading}
        />
        <StatsCard
          title="Unit di Gudang"
          value={stats?.statusCounts['GUDANG'] ?? 0}
          icon={Warehouse}
          description="Tersedia untuk dikirim"
          isLoading={loading}
        />
        <StatsCard
          title="Unit Rusak/Repair"
          value={(stats?.statusCounts['RUSAK'] ?? 0) + (stats?.statusCounts['REPAIR'] ?? 0)}
          icon={AlertTriangle}
          description="Butuh perbaikan/penggantian"
          isLoading={loading}
        />
      </div>

      {/* Detailed Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Dismantle"
          value={stats?.statusCounts['DISMANTLE'] ?? 0}
          icon={Package}
          description="Unit ditarik kembali"
          isLoading={loading}
        />
        <StatsCard
          title="Migrasi"
          value={(stats?.statusCounts['MIGRASI'] ?? 0) + (stats?.statusCounts['PROSES_MIGRASI'] ?? 0)}
          icon={RefreshCw}
          description="Unit dalam proses migrasi"
          isLoading={loading}
        />
        <StatsCard
          title="Proses Instalasi"
          value={stats?.statusCounts['PROSES_INSTALASI'] ?? 0}
          icon={Truck}
          description="Dalam pengiriman/pemasangan"
          isLoading={loading}
        />
        <StatsCard
          title="Hilang"
          value={stats?.statusCounts['HILANG'] ?? 0}
          icon={AlertTriangle}
          description="Unit tidak ditemukan"
          isLoading={loading}
        />
      </div>

      {/* Brand & History Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Distribusi Brand Toko
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.brandCounts.map((brand) => (
                <div key={brand.brandToko || 'Lainnya'} className="flex items-center justify-between">
                  <span className="font-medium">{brand.brandToko || 'Unassigned'}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(brand._count / (stats?.totalUnits || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{brand._count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Update Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.serialNumber}</p>
                    <p className="text-xs text-muted-foreground">{item.product.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
