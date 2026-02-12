import { useDashboardStats, useLowStock, useCategoryData, useStockTrend } from '../hooks/useDashboard';
import { StatsCard } from '../components/dashboard/StatsCard';
import { StockChart } from '../components/dashboard/StockChart';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { LowStockTable } from '../components/dashboard/LowStockTable';
import {
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  RadioIcon,
} from 'lucide-react';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: lowStock, isLoading: lowStockLoading, error: lowStockError } = useLowStock();
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useCategoryData();
  const { data: stockTrend, isLoading: stockTrendLoading, error: stockTrendError } = useStockTrend();

  if (statsError || lowStockError || categoryError || stockTrendError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 font-medium">Error loading dashboard data</p>
          <p className="text-sm text-muted-foreground mt-2">
            {(statsError as Error)?.message ||
             (lowStockError as Error)?.message ||
             (categoryError as Error)?.message ||
             (stockTrendError as Error)?.message ||
             'Please check if the backend server is running on port 8000'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan inventory gudang FTTH</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Produk"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          description="Unique product types"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Total Items"
          value={stats?.totalItems ?? 0}
          icon={Boxes}
          description="Items with serial numbers"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats?.lowStockCount ?? 0}
          icon={AlertTriangle}
          description="Items below threshold"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Total Stock Quantity"
          value={stats?.totalStockQuantity?.toLocaleString() ?? 0}
          icon={TrendingUp}
          description="All stock combined"
          isLoading={statsLoading}
        />
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="In Warehouse"
          value={stats?.itemsByStatus?.GUDANG ?? 0}
          icon={Warehouse}
          description="Available in warehouse"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Deployed"
          value={stats?.itemsByStatus?.TERPASANG ?? 0}
          icon={RadioIcon}
          description="Installed at customer"
          isLoading={statsLoading}
        />
        <StatsCard
          title="With Technicians"
          value={stats?.itemsByStatus?.TEKNISI ?? 0}
          icon={Package}
          description="Currently with technicians"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Damaged"
          value={stats?.itemsByStatus?.RUSAK ?? 0}
          icon={AlertTriangle}
          description="Needs replacement"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <StockChart data={stockTrendLoading || !Array.isArray(stockTrend) ? [] : stockTrend} />
        <CategoryChart data={categoryLoading || !Array.isArray(categoryData) ? [] : categoryData} />
      </div>

      {/* Low Stock Table */}
      <LowStockTable data={lowStockLoading || !Array.isArray(lowStock) ? [] : lowStock} />
    </div>
  );
}
