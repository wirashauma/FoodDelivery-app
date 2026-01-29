// ============================================================
// TITIPIN ADMIN - API FUNCTIONS
// New API endpoints for professional food delivery app
// ============================================================

import api from './api';
import type {
  Merchant,
  MerchantDocument,
  MerchantStats,
  MerchantFilters,
  Order,
  OrderLiveStats,
  OrderFilters,
  MerchantPayout,
  DriverPayout,
  Refund,
  FinancialSummary,
  FinancialReport,
  PayoutFilters,
  Promo,
  Voucher,
  Banner,
  DriverProfile,
  DriverDocument,
  DriverPerformance,
  DriverFilters,
  Category,
  CuisineType,
  DeliveryZone,
  SystemSetting,
  PaginatedResponse,
  PayoutStatus,
} from '@/types/admin';

// ============================================================
// MERCHANT API
// ============================================================

export const merchantAPI = {
  // Get all merchants with pagination and filters
  getAll: async (filters?: MerchantFilters): Promise<PaginatedResponse<Merchant>> => {
    const response = await api.get('/merchant/list', { params: filters });
    return response.data;
  },

  // Get merchant by ID
  getById: async (id: string): Promise<Merchant> => {
    const response = await api.get(`/merchant/${id}`);
    return response.data;
  },

  // Get merchant stats
  getStats: async (id: string): Promise<MerchantStats> => {
    const response = await api.get(`/merchant/${id}/stats`);
    return response.data;
  },

  // Create new merchant
  create: async (data: Partial<Merchant>): Promise<Merchant> => {
    const response = await api.post('/merchant', data);
    return response.data;
  },

  // Update merchant
  update: async (id: string, data: Partial<Merchant>): Promise<Merchant> => {
    const response = await api.put(`/merchant/${id}`, data);
    return response.data;
  },

  // Update merchant status
  updateStatus: async (id: string, status: string, reason?: string): Promise<Merchant> => {
    const response = await api.patch(`/merchant/${id}/status`, { status, reason });
    return response.data;
  },

  // Update merchant commission rate
  updateCommission: async (id: string, commissionRate: number): Promise<Merchant> => {
    const response = await api.patch(`/merchant/${id}/commission`, { commissionRate });
    return response.data;
  },

  // Get merchant documents
  getDocuments: async (id: string): Promise<MerchantDocument[]> => {
    const response = await api.get(`/merchant/${id}/documents`);
    return response.data;
  },

  // Verify merchant document
  verifyDocument: async (
    merchantId: string, 
    documentId: string, 
    status: 'APPROVED' | 'REJECTED', 
    notes?: string
  ): Promise<MerchantDocument> => {
    const response = await api.patch(`/merchant/${merchantId}/documents/${documentId}/verify`, { status, notes });
    return response.data;
  },

  // Get pending verifications
  getPendingVerifications: async (): Promise<Merchant[]> => {
    const response = await api.get('/merchant/pending-verifications');
    return response.data;
  },

  // Delete merchant
  delete: async (id: string): Promise<void> => {
    await api.delete(`/merchant/${id}`);
  },
};

// ============================================================
// ORDER MANAGEMENT SYSTEM (OMS) API
// ============================================================

export const omsAPI = {
  // Get live order stats
  getLiveStats: async (): Promise<OrderLiveStats> => {
    const response = await api.get('/oms/live-stats');
    return response.data;
  },

  // Get all orders with filters
  getOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/oms/orders', { params: filters });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/oms/orders/${id}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string, notes?: string): Promise<Order> => {
    const response = await api.patch(`/oms/orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Assign driver to order
  assignDriver: async (orderId: string, driverId: string): Promise<Order> => {
    const response = await api.post(`/oms/orders/${orderId}/assign-driver`, { driverId });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id: string, reason: string): Promise<Order> => {
    const response = await api.post(`/oms/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Get available drivers for order
  getAvailableDrivers: async (orderId: string): Promise<DriverProfile[]> => {
    const response = await api.get(`/oms/orders/${orderId}/available-drivers`);
    return response.data;
  },

  // Get orders by status (for live monitor)
  getOrdersByStatus: async (status: string[]): Promise<Order[]> => {
    const response = await api.get('/oms/orders/by-status', { params: { status: status.join(',') } });
    return response.data;
  },

  // Get problematic orders (cancelled, disputed, etc.)
  getProblematicOrders: async (): Promise<Order[]> => {
    const response = await api.get('/oms/orders/problematic');
    return response.data;
  },
};

// ============================================================
// FINANCIAL API
// ============================================================

export const financialAPI = {
  // Get financial summary
  getSummary: async (period: string = 'month'): Promise<FinancialSummary> => {
    const response = await api.get('/financial/summary', { params: { period } });
    return response.data;
  },

  // Get financial report
  getReport: async (startDate: string, endDate: string): Promise<FinancialReport> => {
    const response = await api.get('/financial/report', { params: { startDate, endDate } });
    return response.data;
  },

  // ============ MERCHANT PAYOUTS ============

  // Get merchant payouts
  getMerchantPayouts: async (filters?: PayoutFilters): Promise<PaginatedResponse<MerchantPayout>> => {
    const response = await api.get('/financial/merchant-payouts', { params: filters });
    return response.data;
  },

  // Process merchant payout
  processMerchantPayout: async (id: string, action: 'approve' | 'reject', notes?: string): Promise<MerchantPayout> => {
    const response = await api.post(`/financial/merchant-payouts/${id}/process`, { action, notes });
    return response.data;
  },

  // Create merchant payout
  createMerchantPayout: async (merchantId: string, amount: number): Promise<MerchantPayout> => {
    const response = await api.post('/financial/merchant-payouts', { merchantId, amount });
    return response.data;
  },

  // ============ DRIVER PAYOUTS ============

  // Get driver payouts
  getDriverPayouts: async (filters?: PayoutFilters): Promise<PaginatedResponse<DriverPayout>> => {
    const response = await api.get('/financial/driver-payouts', { params: filters });
    return response.data;
  },

  // Process driver payout
  processDriverPayout: async (id: string, action: 'approve' | 'reject', notes?: string): Promise<DriverPayout> => {
    const response = await api.post(`/financial/driver-payouts/${id}/process`, { action, notes });
    return response.data;
  },

  // Create driver payout
  createDriverPayout: async (driverId: string, amount: number): Promise<DriverPayout> => {
    const response = await api.post('/financial/driver-payouts', { driverId, amount });
    return response.data;
  },

  // ============ REFUNDS ============

  // Get refunds
  getRefunds: async (filters?: PayoutFilters): Promise<PaginatedResponse<Refund>> => {
    const response = await api.get('/financial/refunds', { params: filters });
    return response.data;
  },

  // Process refund
  processRefund: async (id: string, action: 'approve' | 'reject', notes?: string): Promise<Refund> => {
    const response = await api.post(`/financial/refunds/${id}/process`, { action, notes });
    return response.data;
  },

  // Create refund request
  createRefund: async (orderId: string, amount: number, reason: string): Promise<Refund> => {
    const response = await api.post('/financial/refunds', { orderId, amount, reason });
    return response.data;
  },

  // ============ COMMISSION SETTINGS ============

  // Get commission settings
  getCommissionSettings: async () => {
    const response = await api.get('/financial/commission-settings');
    return response.data;
  },

  // Update commission settings
  updateCommissionSettings: async (settings: Record<string, number>) => {
    const response = await api.put('/financial/commission-settings', settings);
    return response.data;
  },

  // Export financial report
  exportReport: async (startDate: string, endDate: string, format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await api.get('/financial/export', { 
      params: { startDate, endDate, format },
      responseType: 'blob'
    });
    return response.data;
  },
};

// ============================================================
// PROMO API
// ============================================================

export const promoAPI = {
  // ============ PROMOS ============
  
  // Get all promos
  getPromos: async (filters?: { isActive?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<Promo>> => {
    const response = await api.get('/promo/list', { params: filters });
    return response.data;
  },

  // Get promo by ID
  getPromoById: async (id: string): Promise<Promo> => {
    const response = await api.get(`/promo/${id}`);
    return response.data;
  },

  // Create promo
  createPromo: async (data: Partial<Promo>): Promise<Promo> => {
    const response = await api.post('/promo', data);
    return response.data;
  },

  // Update promo
  updatePromo: async (id: string, data: Partial<Promo>): Promise<Promo> => {
    const response = await api.put(`/promo/${id}`, data);
    return response.data;
  },

  // Toggle promo status
  togglePromoStatus: async (id: string, isActive: boolean): Promise<Promo> => {
    const response = await api.patch(`/promo/${id}/toggle`, { isActive });
    return response.data;
  },

  // Delete promo
  deletePromo: async (id: string): Promise<void> => {
    await api.delete(`/promo/${id}`);
  },

  // ============ VOUCHERS ============

  // Get all vouchers
  getVouchers: async (filters?: { isUsed?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<Voucher>> => {
    const response = await api.get('/promo/vouchers', { params: filters });
    return response.data;
  },

  // Generate vouchers
  generateVouchers: async (promoId: string, quantity: number, prefix?: string): Promise<Voucher[]> => {
    const response = await api.post('/promo/vouchers/generate', { promoId, quantity, prefix });
    return response.data;
  },

  // Assign voucher to user
  assignVoucher: async (voucherId: string, userId: string): Promise<Voucher> => {
    const response = await api.post(`/promo/vouchers/${voucherId}/assign`, { userId });
    return response.data;
  },

  // Void voucher
  voidVoucher: async (voucherId: string): Promise<void> => {
    await api.delete(`/promo/vouchers/${voucherId}`);
  },

  // ============ BANNERS ============

  // Get all banners
  getBanners: async (filters?: { isActive?: boolean }): Promise<Banner[]> => {
    const response = await api.get('/promo/banners', { params: filters });
    return response.data;
  },

  // Get banner by ID
  getBannerById: async (id: string): Promise<Banner> => {
    const response = await api.get(`/promo/banners/${id}`);
    return response.data;
  },

  // Create banner
  createBanner: async (data: Partial<Banner>): Promise<Banner> => {
    const response = await api.post('/promo/banners', data);
    return response.data;
  },

  // Update banner
  updateBanner: async (id: string, data: Partial<Banner>): Promise<Banner> => {
    const response = await api.put(`/promo/banners/${id}`, data);
    return response.data;
  },

  // Reorder banners
  reorderBanners: async (bannerIds: string[]): Promise<void> => {
    await api.post('/promo/banners/reorder', { bannerIds });
  },

  // Delete banner
  deleteBanner: async (id: string): Promise<void> => {
    await api.delete(`/promo/banners/${id}`);
  },
};

// ============================================================
// DRIVER API
// ============================================================

export const driverAPI = {
  // Get all drivers with filters
  getAll: async (filters?: DriverFilters): Promise<PaginatedResponse<DriverProfile>> => {
    const response = await api.get('/driver/list', { params: filters });
    return response.data;
  },

  // Get driver by ID
  getById: async (id: string): Promise<DriverProfile> => {
    const response = await api.get(`/driver/${id}`);
    return response.data;
  },

  // Get driver performance
  getPerformance: async (id: string, period?: string): Promise<DriverPerformance> => {
    const response = await api.get(`/driver/${id}/performance`, { params: { period } });
    return response.data;
  },

  // Update driver status
  updateStatus: async (id: string, status: string, reason?: string): Promise<DriverProfile> => {
    const response = await api.patch(`/driver/${id}/status`, { status, reason });
    return response.data;
  },

  // Get driver documents
  getDocuments: async (id: string): Promise<DriverDocument[]> => {
    const response = await api.get(`/driver/${id}/documents`);
    return response.data;
  },

  // Verify driver document
  verifyDocument: async (
    driverId: string,
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<DriverDocument> => {
    const response = await api.patch(`/driver/${driverId}/documents/${documentId}/verify`, { status, notes });
    return response.data;
  },

  // Get pending driver applications
  getPendingApplications: async (): Promise<DriverProfile[]> => {
    const response = await api.get('/driver/pending-applications');
    return response.data;
  },

  // Approve driver application
  approveApplication: async (id: string): Promise<DriverProfile> => {
    const response = await api.post(`/driver/${id}/approve`);
    return response.data;
  },

  // Reject driver application
  rejectApplication: async (id: string, reason: string): Promise<DriverProfile> => {
    const response = await api.post(`/driver/${id}/reject`, { reason });
    return response.data;
  },

  // Get online drivers
  getOnlineDrivers: async (): Promise<DriverProfile[]> => {
    const response = await api.get('/driver/online');
    return response.data;
  },

  // Get driver wallet
  getWallet: async (id: string) => {
    const response = await api.get(`/driver/${id}/wallet`);
    return response.data;
  },

  // Get driver wallet transactions
  getWalletTransactions: async (id: string, filters?: { page?: number; limit?: number }) => {
    const response = await api.get(`/driver/${id}/wallet/transactions`, { params: filters });
    return response.data;
  },
};

// ============================================================
// MASTER DATA API
// ============================================================

export const masterDataAPI = {
  // ============ CATEGORIES ============

  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/master-data/categories');
    return response.data;
  },

  // Create category
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post('/master-data/categories', data);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/master-data/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/master-data/categories/${id}`);
  },

  // Reorder categories
  reorderCategories: async (categoryIds: string[]): Promise<void> => {
    await api.post('/master-data/categories/reorder', { categoryIds });
  },

  // ============ CUISINE TYPES ============

  // Get all cuisine types
  getCuisineTypes: async (): Promise<CuisineType[]> => {
    const response = await api.get('/master-data/cuisine-types');
    return response.data;
  },

  // Create cuisine type
  createCuisineType: async (data: Partial<CuisineType>): Promise<CuisineType> => {
    const response = await api.post('/master-data/cuisine-types', data);
    return response.data;
  },

  // Update cuisine type
  updateCuisineType: async (id: string, data: Partial<CuisineType>): Promise<CuisineType> => {
    const response = await api.put(`/master-data/cuisine-types/${id}`, data);
    return response.data;
  },

  // Delete cuisine type
  deleteCuisineType: async (id: string): Promise<void> => {
    await api.delete(`/master-data/cuisine-types/${id}`);
  },

  // ============ DELIVERY ZONES ============

  // Get all delivery zones
  getDeliveryZones: async (): Promise<DeliveryZone[]> => {
    const response = await api.get('/master-data/delivery-zones');
    return response.data;
  },

  // Create delivery zone
  createDeliveryZone: async (data: Partial<DeliveryZone>): Promise<DeliveryZone> => {
    const response = await api.post('/master-data/delivery-zones', data);
    return response.data;
  },

  // Update delivery zone
  updateDeliveryZone: async (id: string, data: Partial<DeliveryZone>): Promise<DeliveryZone> => {
    const response = await api.put(`/master-data/delivery-zones/${id}`, data);
    return response.data;
  },

  // Delete delivery zone
  deleteDeliveryZone: async (id: string): Promise<void> => {
    await api.delete(`/master-data/delivery-zones/${id}`);
  },

  // ============ SYSTEM SETTINGS ============

  // Get all system settings
  getSettings: async (category?: string): Promise<SystemSetting[]> => {
    const response = await api.get('/master-data/settings', { params: { category } });
    return response.data;
  },

  // Get setting by key
  getSetting: async (key: string): Promise<SystemSetting> => {
    const response = await api.get(`/master-data/settings/${key}`);
    return response.data;
  },

  // Update setting
  updateSetting: async (key: string, value: string): Promise<SystemSetting> => {
    const response = await api.put(`/master-data/settings/${key}`, { value });
    return response.data;
  },

  // Bulk update settings
  bulkUpdateSettings: async (settings: { key: string; value: string }[]): Promise<void> => {
    await api.put('/master-data/settings', { settings });
  },
};

// ============================================================
// NOTIFICATION API (Enhanced)
// ============================================================

export const notificationAPI = {
  // Get all notifications
  getAll: async (filters?: { type?: string; isRead?: boolean; page?: number; limit?: number }) => {
    const response = await api.get('/notification/list', { params: filters });
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notification/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.post('/notification/read-all');
    return response.data;
  },

  // Send notification (admin)
  send: async (data: { userId?: string; role?: string; title: string; body: string; type: string }) => {
    const response = await api.post('/notification/send', data);
    return response.data;
  },

  // Send bulk notification
  sendBulk: async (data: { userIds: string[]; title: string; body: string; type: string }) => {
    const response = await api.post('/notification/send-bulk', data);
    return response.data;
  },
};

// ============================================================
// AUDIT LOG API
// ============================================================

export const auditLogAPI = {
  // Get audit logs
  getAll: async (filters?: { 
    userId?: string; 
    action?: string; 
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number; 
    limit?: number 
  }) => {
    const response = await api.get('/audit-logs', { params: filters });
    return response.data;
  },

  // Get audit log by ID
  getById: async (id: string) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },
};
