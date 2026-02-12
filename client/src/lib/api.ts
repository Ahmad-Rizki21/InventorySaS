const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Track if token refresh is in progress
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 10 * 1000; // 10 seconds cooldown

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Enhanced fetch with token refresh
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current token
  const token = localStorage.getItem('token');

  // Add authorization header if token exists
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Add credentials for cookies
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
  };

  let response = await fetch(url, config);

  // If 401 and not already refreshing, try to refresh token
  if (response.status === 401 && !isRefreshing) {
    const now = Date.now();
    // Rate limit - don't attempt refresh if recently attempted
    if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Too many refresh attempts');
    }

    lastRefreshAttempt = now;
    isRefreshing = true;

    try {
      // Try to refresh token
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('token', data.accessToken);

        // Process any queued requests
        processQueue(null, data.accessToken);

        // Retry original request with new token
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${data.accessToken}`,
        };

        response = await fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include' as RequestCredentials,
        });
      } else {
        // Refresh failed, logout user
        processQueue(new Error('Session expired'), null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } catch (error) {
      processQueue(error, null);
      throw error;
    } finally {
      isRefreshing = false;
    }
  } else if (response.status === 401 && isRefreshing) {
    // If already refreshing, add to queue
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      // Retry original request after refresh
      return fetch(url, config);
    });
  }

  return response;
}

// Helper functions
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.text().then(text => {
      try {
        return JSON.parse(text);
      } catch {
        return { message: text || response.statusText };
      }
    });
    throw new Error(error.message || error.error || 'API request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function get(url: string) {
  const response = await apiFetch(url);
  return handleResponse(response);
}

export async function post(url: string, data: any) {
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function put(url: string, data: any) {
  const response = await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function del(url: string) {
  const response = await apiFetch(url, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function patch(url: string, data: any) {
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// API endpoints
export const api = {
  // Auth
  login: (email: string, password: string) =>
    post('/api/auth/login', { email, password }),
  logout: () => post('/api/auth/logout', {}),
  refreshToken: () => post('/api/auth/refresh', {}),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/api/auth/change-password', { currentPassword, newPassword }),
  getCurrentUser: () => get('/api/auth/me'),

  // Dashboard
  getStats: () => get('/api/dashboard/stats'),
  getLowStock: (threshold?: number) => get(`/api/dashboard/low-stock?threshold=${threshold || 5}`),
  getByCategory: () => get('/api/dashboard/by-category'),
  getStockTrend: () => get('/api/dashboard/stock-trend'),
  getRecentActivities: () => get('/api/dashboard/recent-activities'),

  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    get(`/api/products${new URLSearchParams(params as any).toString()}`),
  createProduct: (data: any) => post('/api/products', data),
  updateProduct: (id: string, data: any) => put(`/api/products/${id}`, data),
  deleteProduct: (id: string) => del(`/api/products/${id}`),

  // Stocks
  getStocks: () => get('/api/stocks'),
  stockIn: (productId: string, quantity: number, warehouseId?: string) =>
    post('/api/stocks/in', { productId, quantity, warehouseId }),
  stockOut: (productId: string, quantity: number, warehouseId?: string) =>
    post('/api/stocks/out', { productId, quantity, warehouseId }),

  // Items (SN-based)
  getItems: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    get(`/api/items${new URLSearchParams(params as any).toString()}`),
  createItem: (data: any) => post('/api/items', data),
  updateItem: (id: string, data: any) => put(`/api/items/${id}`, data),
  updateItemStatus: (id: string, status: string) =>
    patch(`/api/items/${id}/status`, { status }),
  deleteItem: (id: string) => del(`/api/items/${id}`),

  // Activity Logs
  getActivityLogs: (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => get(`/api/activity-logs${new URLSearchParams(params as any).toString()}`),
  getActivityLog: (id: string) => get(`/api/activity-logs/${id}`),
  getActionTypes: () => get('/api/activity-logs/meta/actions'),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    get(`/api/users${new URLSearchParams(params as any).toString()}`),
  getUser: (id: string) => get(`/api/users/${id}`),
  createUser: (data: any) => post('/api/users', data),
  updateUser: (id: string, data: any) => put(`/api/users/${id}`, data),
  deleteUser: (id: string) => del(`/api/users/${id}`),
  resetUserPassword: (id: string, newPassword: string) =>
    post(`/api/users/${id}/reset-password`, { newPassword }),
};

export default api;
