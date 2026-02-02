'use client';

import { useEffect, useState } from 'react';
import { 
  adminDashboardAPI, 
  adminUsersAPI, 
  adminOrdersAPI, 
  adminDeliverersAPI 
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
    id: number;
    name: string;
  };
  merchant: {
    id: number;
    businessName: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}
    primary: {
      bg: 'bg-gradient-to-br from-primary-500 to-primary-700',
      shadow: 'shadow-primary-500/20',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/20',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      shadow: 'shadow-purple-500/20',
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-500 to-rose-600',
      shadow: 'shadow-pink-500/20',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-500 to-sky-600',
      shadow: 'shadow-cyan-500/20',
    },
  };

  const style = colorStyles[color];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{value}</h3>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate hidden sm:block">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 sm:mt-2 text-xs sm:text-sm ${trend.isPositive ? 'text-primary-600' : 'text-red-500'}`}>
              {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-medium">{trend.value}%</span>
              <span className="text-gray-400 text-[10px] sm:text-xs hidden md:inline">vs bulan lalu</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${style.bg} ${style.shadow} shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0 ml-2`}>
          <Icon size={18} className="text-white sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 text-left group w-full"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-2 sm:p-2.5 rounded-lg ${color} shrink-0`}>
          <Icon size={18} className="text-white sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors text-sm sm:text-base truncate">{title}</h4>
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">{description}</p>
        </div>
        <ArrowUpRight size={16} className="hidden sm:block ml-auto text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topDeliverers, setTopDeliverers] = useState<TopDeliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'orders' | 'revenue'>('orders');

  useEffect(() => {
    fetchDashboardStats();
    fetchTopDeliverers();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTopDeliverers = async () => {
    try {
      const response = await dashboardAPI.getTopDeliverers(5);
      setTopDeliverers(response.data);
    } catch (error) {
      console.error('Error fetching top deliverers:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}K`;
    }
    return `Rp ${value}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
      CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
      PREPARING: 'bg-purple-100 text-purple-700 border-purple-200',
      READY: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      PICKED_UP: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-primary-500 via-primary-600 to-primary-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl shadow-primary-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Selamat Datang, Admin! 👋</h1>
            <p className="text-primary-100 mt-1 text-sm sm:text-base">
              Berikut adalah ringkasan bisnis Anda hari ini. Tetap semangat!
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center flex-1 lg:flex-none">
              <p className="text-[10px] sm:text-xs text-primary-100">Hari ini</p>
              <p className="font-bold text-sm sm:text-base">{format(new Date(), 'dd MMM yyyy')}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center flex-1 lg:flex-none">
              <p className="text-xs text-primary-100">Status</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="font-bold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <ElegantStatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon={Users}
          color="blue"
          trend={stats?.users?.growth !== undefined ? { value: Math.abs(stats.users.growth), isPositive: stats.users.growth >= 0 } : undefined}
          subtitle="Pengguna aktif"
        />
        <ElegantStatsCard
          title="Total Deliverer"
          value={stats?.deliverers?.total || 0}
          icon={Bike}
          color="primary"
          trend={stats?.deliverers?.growth !== undefined ? { value: Math.abs(stats.deliverers.growth), isPositive: stats.deliverers.growth >= 0 } : undefined}
          subtitle="Kurir terdaftar"
        />
        <ElegantStatsCard
          title="Total Orders"
          value={stats?.orders?.total || 0}
          icon={Package}
          color="orange"
          trend={stats?.orders?.growth !== undefined ? { value: Math.abs(stats.orders.growth), isPositive: stats.orders.growth >= 0 } : undefined}
          subtitle="Pesanan masuk"
        />
        <ElegantStatsCard
          title="Rating Avg"
          value={stats?.ratings?.average || 0}
          icon={Star}
          color="pink"
          subtitle={`Dari ${stats?.ratings?.total || 0} review`}
        />
        <ElegantStatsCard
          title="Satisfaction"
          value={`${stats?.satisfaction || 0}%`}
          icon={Target}
          color="cyan"
          subtitle="Kepuasan pelanggan"
        />
        <ElegantStatsCard
          title="Revenue"
          value={formatShortCurrency(stats?.revenue?.total || 0)}
          icon={DollarSign}
          color="purple"
          trend={stats?.revenue?.growth !== undefined ? { value: Math.abs(stats.revenue.growth), isPositive: stats.revenue.growth >= 0 } : undefined}
          subtitle="Total pendapatan"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <QuickActionCard
          title="Pesanan Pending"
          description={`${stats?.orders?.pending || 0} pesanan menunggu`}
          icon={Clock}
          color="bg-gradient-to-r from-amber-500 to-orange-500"
        />
        <QuickActionCard
          title="Hari Ini"
          description={`${stats?.orders?.today || 0} pesanan masuk`}
          icon={Bike}
          color="bg-gradient-to-r from-purple-500 to-violet-500"
        />
        <QuickActionCard
          title="Pesanan Selesai"
          description={`${stats?.orders?.completed || 0} pesanan selesai`}
          icon={Activity}
          color="bg-gradient-to-r from-primary-500 to-primary-700"
        />
        <QuickActionCard
          title="Minggu Ini"
          description={`${stats?.orders?.thisWeek || 0} pesanan total`}
          icon={Zap}
          color="bg-gradient-to-r from-blue-500 to-indigo-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Statistik Bisnis</h3>
              <p className="text-xs sm:text-sm text-gray-400">Performa 7 hari terakhir</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveChart('orders')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeChart === 'orders'
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pesanan
              </button>
              <button
                onClick={() => setActiveChart('revenue')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeChart === 'revenue'
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {activeChart === 'orders' ? (
              <AreaChart data={stats?.orderGrowth || []}>
                <defs>
                  <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E53935" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#E53935"
                  fill="url(#orderGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#E53935', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#E53935', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            ) : (
              <BarChart data={stats?.orderGrowth || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                  labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy')}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Top Deliverers */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Top Deliverer</h3>
            <button 
              onClick={() => router.push('/deliverers')}
              className="text-xs sm:text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {topDeliverers.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Bike size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs sm:text-sm">Belum ada data deliverer</p>
              </div>
            ) : (
              topDeliverers.map((deliverer, index) => (
                <div
                  key={deliverer.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push('/deliverers')}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-sm sm:text-lg">
                      {deliverer.avatar ? (
                        <img src={deliverer.avatar} alt={deliverer.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{deliverer.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {index < 3 && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-amber-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{deliverer.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">{deliverer.orders} pesanan</p>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm shrink-0">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-gray-700">{deliverer.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Pesanan Terbaru</h3>
            <p className="text-xs sm:text-sm text-gray-400">5 pesanan terakhir</p>
          </div>
          <button 
            onClick={() => router.push('/orders')}
            className="text-xs sm:text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-0.5 sm:gap-1 shrink-0"
          >
            <span className="hidden sm:inline">Lihat Semua</span>
            <span className="sm:hidden">Semua</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-125">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders?.slice(0, 5).map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm font-bold text-gray-800">
                      #{order.order_id.toString().padStart(5, '0')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] sm:text-xs font-bold">
                          {(order.user?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 truncate">{order.user?.username || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                    {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={32} className="text-gray-300" />
                      <p className="text-gray-500 font-medium text-sm sm:text-base">Belum ada pesanan</p>
                      <p className="text-gray-400 text-xs sm:text-sm">Pesanan baru akan muncul di sini</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
