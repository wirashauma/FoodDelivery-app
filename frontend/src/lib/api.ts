import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { logger } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken') || Cookies.get('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the request
    logger.api.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      hasToken: !!token,
    });
    
    return config;
  },
  (error) => {
    logger.api.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and logging
api.interceptors.response.use(
  (response) => {
    // Log successful response
    logger.api.info(`Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      dataPreview: typeof response.data === 'object' 
        ? { ...response.data, data: response.data?.data ? '[DATA]' : undefined }
        : response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Log the error
    logger.api.error(`Response Error: ${error.response?.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: originalRequest?.url,
      errorMessage: error.message,
      responseData: error.response?.data,
    });

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this is the refresh endpoint or login
      if (originalRequest.url?.includes('/auth/refresh-token') || 
          originalRequest.url?.includes('/auth/login')) {
        logger.auth.warn('401 on auth endpoint, clearing auth data and redirecting');
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        logger.auth.debug('Token refresh already in progress, queuing request');
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');
      
      if (!refreshToken) {
        logger.auth.warn('No refresh token available, redirecting to login');
        isRefreshing = false;
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }

      try {
        logger.auth.info('Attempting to refresh access token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

        // Store new tokens
        Cookies.set('authToken', accessToken, { expires: expiresIn / 86400 }); // convert seconds to days
        Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
        
        logger.auth.info('Token refresh successful, retrying original request');

        isRefreshing = false;
        processQueue(null, accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        logger.auth.error('Token refresh failed', refreshError);
        isRefreshing = false;
        processQueue(refreshError as Error, null);
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to clear auth data
const clearAuthData = () => {
  Cookies.remove('authToken');
  Cookies.remove('refreshToken');
  Cookies.remove('adminToken');
  Cookies.remove('userRole');
  Cookies.remove('userId');
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
  logout: async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  },
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      clearAuthData();
    }
  },
  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },
  updateProfile: async (data: Record<string, unknown>) => {
    const response = await api.post('/profile/me', data);
    return response.data;
  },
};

// Products API (for User)
export const productsAPI = {
  getAll: async (kategori = '', restaurantId = '') => {
    const response = await api.get('/products', {
      params: { kategori, restaurantId },
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  create: async (data: {
    nama: string;
    deskripsi: string;
    harga: number;
    imageUrl: string;
    kategori: string;
    restaurantId?: number;
    isAvailable?: boolean;
  }) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Restaurants API
export const restaurantsAPI = {
  getAll: async () => {
    const response = await api.get('/restaurants');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },
  create: async (data: {
    nama: string;
    deskripsi?: string;
    alamat: string;
    imageUrl?: string;
    isActive?: boolean;
  }) => {
    const response = await api.post('/restaurants', data);
    return response.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.put(`/restaurants/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/restaurants/${id}`);
    return response.data;
  },
};

// Orders API (for User & Deliverer)
export const ordersAPI = {
  // User endpoints
  create: async (data: { itemId: string; quantity: number; destination: string }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  getMyHistory: async () => {
    const response = await api.get('/orders/my-history');
    return response.data;
  },
  getOrderOffers: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}/offers`);
    return response.data;
  },
  
  // Deliverer endpoints
  getAvailable: async () => {
    const response = await api.get('/orders/available');
    return response.data;
  },
  getMyActiveJobs: async () => {
    const response = await api.get('/orders/my-active-jobs');
    return response.data;
  },
  updateStatus: async (orderId: number, status: string) => {
    const response = await api.post(`/orders/${orderId}/update-status`, { status });
    return response.data;
  },
  getDelivererStats: async () => {
    const response = await api.get('/orders/deliverer/dashboard/stats');
    return response.data;
  },
  getDelivererActive: async () => {
    const response = await api.get('/orders/deliverer/active');
    return response.data;
  },
  getDelivererCompleted: async (limit = 10, offset = 0) => {
    const response = await api.get(`/orders/deliverer/completed?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  // Admin endpoints
  getAll: async (page = 1, limit = 10, status = '', startDate = '', endDate = '') => {
    const response = await api.get('/admin/orders', {
      params: { page, limit, status, startDate, endDate },
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },
  adminUpdateStatus: async (id: number, status: string) => {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
    return response.data;
  },
};

// Offers API
export const offersAPI = {
  create: async (orderId: number, fee: number) => {
    const response = await api.post('/offers', { orderId, fee });
    return response.data;
  },
  accept: async (offerId: number) => {
    const response = await api.post(`/offers/${offerId}/accept`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },
  getMessages: async (chatId: number) => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },
  sendMessage: async (chatId: number, message: string) => {
    const response = await api.post(`/chats/${chatId}/messages`, { message });
    return response.data;
  },
  getOrCreateChat: async (orderId: number) => {
    const response = await api.post('/chats/start', { orderId });
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  getTopDeliverers: async (limit = 5) => {
    const response = await api.get('/admin/dashboard/top-deliverers', {
      params: { limit },
    });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (limit = 10) => {
    const response = await api.get('/admin/notifications', {
      params: { limit },
    });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/admin/users', {
      params: { page, limit, search },
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};

// Deliverers API
export const deliverersAPI = {
  getAll: async (page = 1, limit = 10, status = '', search = '', sortBy = 'created_at') => {
    const response = await api.get('/admin/deliverers', {
      params: { page, limit, status, search, sortBy },
    });
    return response.data;
  },
  getOverview: async () => {
    const response = await api.get('/admin/deliverers/overview');
    return response.data;
  },
  getPending: async () => {
    const response = await api.get('/admin/deliverers/pending');
    return response.data;
  },
  register: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/deliverers/register', data);
    return response.data;
  },
  approve: async (id: number) => {
    const response = await api.put(`/admin/deliverers/${id}/approve`);
    return response.data;
  },
  reject: async (id: number, reason: string) => {
    const response = await api.put(`/admin/deliverers/${id}/reject`, { reason });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/admin/deliverers/${id}`);
    return response.data;
  },
  getPerformance: async (id: number) => {
    const response = await api.get(`/admin/deliverers/${id}/performance`);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/admin/deliverers/${id}`);
    return response.data;
  },
};

// Earnings API
export const earningsAPI = {
  getSummary: async (period = 'month') => {
    const response = await api.get('/admin/earnings/summary', {
      params: { period },
    });
    return response.data;
  },
  getDelivererEarnings: async (delivererId: number, startDate = '', endDate = '') => {
    const response = await api.get(`/admin/earnings/deliverer/${delivererId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
  getReport: async (startDate: string, endDate: string) => {
    const response = await api.get('/admin/earnings/report', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// Export API
export const exportAPI = {
  users: async () => {
    const response = await api.get('/admin/export/users');
    return response.data;
  },
  orders: async (startDate = '', endDate = '') => {
    const response = await api.get('/admin/export/orders', {
      params: { startDate, endDate },
    });
    return response.data;
  },
  deliverers: async () => {
    const response = await api.get('/admin/export/deliverers');
    return response.data;
  },
};

export default api;
