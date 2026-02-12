import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const api = {
  // Dashboard
  getStats: () => fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    headers: getAuthHeaders()
  }).then(r => r.json()),
  
  getLowStock: (threshold = 10) => fetch(`${API_BASE_URL}/api/dashboard/low-stock?threshold=${threshold}`, {
    headers: getAuthHeaders()
  }).then(r => r.json()),
  
  getByCategory: () => fetch(`${API_BASE_URL}/api/dashboard/by-category`, {
    headers: getAuthHeaders()
  }).then(r => r.json()),
  
  getStockTrend: () => fetch(`${API_BASE_URL}/api/dashboard/stock-trend`, {
    headers: getAuthHeaders()
  }).then(r => r.json()),
  
  getRecentActivities: (limit = 10) => fetch(`${API_BASE_URL}/api/dashboard/recent-activities?limit=${limit}`, {
    headers: getAuthHeaders()
  }).then(r => r.json()),

  // Products
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE_URL}/api/products?${searchParams}`, {
      headers: getAuthHeaders()
    }).then(r => r.json());
  },
  
  createProduct: (data: unknown) => fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json()),

  updateProduct: (id: string, data: unknown) => fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json()),

  deleteProduct: (id: string) => fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  getProduct: (id: string) => fetch(`${API_BASE_URL}/api/products/${id}`, {
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  // Items
  getItems: (params = {}) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE_URL}/api/items?${searchParams}`, {
      headers: getAuthHeaders()
    }).then(r => r.json());
  },
  
  getItemBySerialNumber: (sn: string) => fetch(`${API_BASE_URL}/api/items/scan/${sn}`, {
    headers: getAuthHeaders()
  }).then(r => r.json()),
  
  createItem: (data: unknown) => fetch(`${API_BASE_URL}/api/items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json()),
  
  updateItemStatus: (id: string, data: unknown) => fetch(`${API_BASE_URL}/api/items/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json()),

  // Stocks
  getStocks: (params = {}) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE_URL}/api/stocks?${searchParams}`, {
      headers: getAuthHeaders()
    }).then(r => r.json());
  },
  
  stockIn: (data: unknown) => fetch(`${API_BASE_URL}/api/stocks/in`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json()),
  
  stockOut: (data: unknown) => fetch(`${API_BASE_URL}/api/stocks/out`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json()),

  // Sync
  syncArtacom: () => fetch(`${API_BASE_URL}/api/sync/artacom`, {
    method: 'POST',
    headers: getAuthHeaders(),
  }).then(r => r.json()),
};
