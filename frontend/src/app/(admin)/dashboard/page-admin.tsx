'use client';

import { useEffect, useState } from 'react';
import { 
  adminDashboardAPI, 
  adminOrdersAPI, 
  adminUsersAPI 
} from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import StatCard from '@/components/admin/StatCard';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  Users,
  Bike,
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Store,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  merchants: {
    total: number;
    active: number;
    pendingVerification: number;
  };
  deliverers: {
    total: number;
    active: number;
    inactive: number;
    available: number;
  };
  orders: {
    total: number;
    today: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    platformEarnings: number;
  };
}

interface TopDeliverer {
  id: number;
  name: string;
  email: string;
  completedOrders: number;
  totalEarnings: number;
  rating: number;
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  customer: {
    name: string;
  };
  merchant: {
    businessName: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topDeliverers, setTopDeliverers] = useState<TopDeliverer[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsData = await adminDashboardAPI.getStats();
      setStats(statsData);

      // Fetch top deliverers
      const deliverersData = await adminDashboardAPI.getTopDeliverers();
      setTopDeliverers(deliverersData.slice(0, 5));

      // Fetch recent orders
      const ordersData = await adminOrdersAPI.getAll({ limit: 10 });
      setRecentOrders(ordersData?.items || ordersData || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Table columns for recent orders
  const orderColumns: Column<RecentOrder>[] = [
    {
      header: 'No. Order',
      accessor: 'orderNumber',
    },
    {
      header: 'Customer',
      accessor: (order) => order.customer?.name || 'N/A',
    },
    {
      header: 'Merchant',
      accessor: (order) => order.merchant?.businessName || 'N/A',
    },
    {
      header: 'Status',
      accessor: (order) => (
        <StatusBadge 
          status={order.status as any} 
        />
      ),
    },
    {
      header: 'Total',
      accessor: (order) => formatCurrency(order.totalAmount),
      className: 'font-semibold',
    },
    {
      header: 'Tanggal',
      accessor: (order) => format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale }),
      className: 'text-gray-600',
    },
  ];

  // Table columns for top deliverers
  const delivererColumns: Column<TopDeliverer>[] = [
    {
      header: 'Driver',
      accessor: (deliverer) => (
        <div>
          <div className="font-medium text-gray-900">{deliverer.name}</div>
          <div className="text-sm text-gray-500">{deliverer.email}</div>
        </div>
      ),
    },
    {
      header: 'Orders',
      accessor: (deliverer) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{deliverer.completedOrders}</span>
        </div>
      ),
    },
    {
      header: 'Earnings',
      accessor: (deliverer) => (
        <span className="text-green-600 font-semibold">
          {formatCurrency(deliverer.totalEarnings)}
        </span>
      ),
    },
    {
      header: 'Rating',
      accessor: (deliverer) => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          <span className="font-medium">{deliverer.rating.toFixed(1)}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-blue-100">
          Selamat datang! Kelola platform food delivery dengan mudah.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          subtitle={`${stats?.users.newThisMonth || 0} user baru bulan ini`}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Total Merchants"
          value={stats?.merchants.total || 0}
          subtitle={`${stats?.merchants.active || 0} aktif`}
          icon={Store}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <StatCard
          title="Total Drivers"
          value={stats?.deliverers.total || 0}
          subtitle={`${stats?.deliverers.available || 0} tersedia`}
          icon={Bike}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Total Orders"
          value={stats?.orders.total || 0}
          subtitle={`${stats?.orders.today || 0} hari ini`}
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Orders"
          value={stats?.orders.pending || 0}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="Processing"
          value={stats?.orders.processing || 0}
          icon={Package}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Completed"
          value={stats?.orders.completed || 0}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Cancelled"
          value={stats?.orders.cancelled || 0}
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue.total || 0)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Revenue Today"
          value={formatCurrency(stats?.revenue.today || 0)}
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats?.revenue.thisMonth || 0)}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/users')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600">Kelola pengguna</p>
          </button>
          <button
            onClick={() => router.push('/merchants')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
          >
            <Store className="h-8 w-8 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Merchants</h3>
            <p className="text-sm text-gray-600">Kelola merchant</p>
          </button>
          <button
            onClick={() => router.push('/deliverers')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
          >
            <Bike className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Drivers</h3>
            <p className="text-sm text-gray-600">Kelola driver</p>
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
          >
            <ShoppingCart className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Orders</h3>
            <p className="text-sm text-gray-600">Lihat pesanan</p>
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button
              onClick={() => router.push('/orders')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Lihat Semua →
            </button>
          </div>
        </div>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          keyExtractor={(order) => order.id.toString()}
          onRowClick={(order) => router.push(`/orders/${order.id}`)}
          emptyMessage="Belum ada pesanan"
        />
      </div>

      {/* Top Deliverers */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Drivers</h2>
        </div>
        <DataTable
          columns={delivererColumns}
          data={topDeliverers}
          keyExtractor={(deliverer) => deliverer.id.toString()}
          onRowClick={(deliverer) => router.push(`/deliverers/${deliverer.id}`)}
          emptyMessage="Belum ada data driver"
        />
      </div>

      {/* Alerts if needed */}
      {stats && stats.merchants.pendingVerification > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Merchant Verification Needed</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Ada {stats.merchants.pendingVerification} merchant yang menunggu verifikasi.
              </p>
              <button
                onClick={() => router.push('/merchants')}
                className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Review sekarang →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
