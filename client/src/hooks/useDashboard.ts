import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/utils';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: api.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useLowStock(threshold = 10) {
  return useQuery({
    queryKey: ['dashboard', 'lowStock', threshold],
    queryFn: () => api.getLowStock(threshold),
    refetchInterval: 30000,
  });
}

export function useCategoryData() {
  return useQuery({
    queryKey: ['dashboard', 'category'],
    queryFn: api.getByCategory,
    refetchInterval: 30000,
  });
}

export function useStockTrend() {
  return useQuery({
    queryKey: ['dashboard', 'stockTrend'],
    queryFn: api.getStockTrend,
    refetchInterval: 30000,
  });
}

export function useRecentActivities(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activities', limit],
    queryFn: () => api.getRecentActivities(limit),
    refetchInterval: 30000,
  });
}
