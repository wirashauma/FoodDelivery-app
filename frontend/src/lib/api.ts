import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.4:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: () => {
    Cookies.remove('adminToken');
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
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
  getAll: async (page = 1, limit = 10, status = '') => {
    const response = await api.get('/admin/deliverers', {
      params: { page, limit, status },
    });
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
};

// Orders API
export const ordersAPI = {
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
  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
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

export default api;
