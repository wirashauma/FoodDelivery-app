'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { merchantAPI } from '@/lib/api';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  pendingPayout: number;
}

interface MerchantInfo {
  businessName: string;
  rating: number;
  reviewCount: number;
}

interface RecentOrder {
  id: number;
  orderNumber?: string;
  status: string;
  total?: number;
  subtotal?: number;
  items?: { name?: string }[];
}

export default function MerchantDashboard() {
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    pendingPayout: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch merchant stats
      const statsRes = await merchantAPI.getStats();
      
      if (statsRes?.merchant) {
        setMerchantInfo(statsRes.merchant);
      }
      
      if (statsRes?.stats) {
        setStats({
          totalProducts: statsRes.stats.totalProducts || 0,
          activeProducts: statsRes.stats.totalProducts || 0,
          todayOrders: statsRes.stats.todayOrders || 0,
          pendingOrders: statsRes.stats.pendingOrders || 0,
          completedOrders: statsRes.stats.completedOrders || 0,
          cancelledOrders: 0,
          totalRevenue: statsRes.stats.totalRevenue || 0,
          pendingPayout: 0,
        });
      }
      
      // Fetch recent orders
      const ordersRes = await merchantAPI.getOrders({ limit: 5 });
      const orders = Array.isArray(ordersRes) ? ordersRes : [];
      setRecentOrders(orders);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PREPARING: 'bg-blue-100 text-blue-800',
      READY: 'bg-purple-100 text-purple-800',
      PICKED_UP: 'bg-cyan-100 text-cyan-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Selamat Datang{merchantInfo?.businessName ? `, ${merchantInfo.businessName}` : ''}! 👋
        </h1>
        <p className="text-orange-100">Kelola restoran dan pesanan Anda dengan mudah.</p>
        {merchantInfo && (
          <div className="mt-2 text-sm text-orange-100">
            ⭐ Rating: {merchantInfo.rating?.toFixed(1) || 'N/A'} ({merchantInfo.reviewCount || 0} ulasan)
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Produk</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {stats.activeProducts} produk aktif
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pesanan Hari Ini</p>
              <p className="text-2xl font-bold">{stats.todayOrders}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-yellow-600 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {stats.pendingOrders} menunggu diproses
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pesanan Selesai</p>
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-red-500 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            {stats.cancelledOrders} dibatalkan
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pendapatan</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-green-500 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Periode ini
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Pesanan Terbaru</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada pesanan</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">Order #{order.orderNumber || String(order.id).substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {order.items?.length || 0} item • {formatCurrency(order.subtotal || order.total || 0)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
