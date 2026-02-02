'use client';

import { useEffect, useState, useCallback } from 'react';
import { deliverersAPI, exportAPI } from '@/lib/api';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DelivererProfile } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Eye,
  Check,
  X,
  UserPlus,
  Search,
  Star,
  Clock,
  TrendingUp,
  Bike,
  Mail,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  ChevronDown,
  MoreVertical,
  Trash2,
  Download,
} from 'lucide-react';

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'primary' | 'blue' | 'orange' | 'purple' | 'pink';
  trend?: { value: number; isPositive: boolean };
}) {
  const colors = {
    primary: 'from-primary-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    orange: 'from-orange-500 to-amber-600',
    purple: 'from-purple-500 to-violet-600',
    pink: 'from-pink-500 to-rose-600',
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mt-0.5 sm:mt-1 truncate">{value}</h3>
          {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate hidden sm:block">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 sm:mt-2 text-[10px] sm:text-xs ${trend.isPositive ? 'text-primary-600' : 'text-red-500'}`}>
              <TrendingUp size={10} className="sm:w-3 sm:h-3" />
              <span className="truncate">{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-linear-to-br ${colors[color]} shadow-lg shrink-0`}>
          <Icon size={16} className="text-white sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}

// Badge Component for achievements
function BadgeTag({ type }: { type: '5-star' | 'top-performer' | 'customer-favorite' | 'new' }) {
  const badges = {
    '5-star': { label: '5-Star Expert', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⭐' },
    'top-performer': { label: 'Top Performer', bg: 'bg-primary-100', text: 'text-primary-700', icon: '🏆' },
    'customer-favorite': { label: 'Customer Favorite', bg: 'bg-pink-100', text: 'text-pink-700', icon: '❤️' },
    'new': { label: 'New', bg: 'bg-blue-100', text: 'text-blue-700', icon: '🆕' },
  };

  const badge = badges[type];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      <span>{badge.icon}</span>
      {badge.label}
    </span>
  );
}

// Performance Metric Component
function PerformanceMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// Stats overview type
interface StatsOverview {
  totalDeliverers: number;
  activeDeliverers: number;
  pendingApproval: number;
  avgRating: number;
  avgSatisfaction: number;
  totalRevenue: number;
}

// Performance data type
interface PerformanceData {
  onTime: number;
  responseTime: number;
  satisfaction: number;
  rebookRate: number;
  completedOrders: number;
  revenue: number;
  badges: ('5-star' | 'top-performer' | 'customer-favorite' | 'new')[];
}

export default function DeliverersPage() {
  const [deliverers, setDeliverers] = useState<DelivererProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [selectedDeliverer, setSelectedDeliverer] = useState<DelivererProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'statistics'>('list');
  
  // Stats from API
  const [stats, setStats] = useState<StatsOverview>({
    totalDeliverers: 0,
    activeDeliverers: 0,
    pendingApproval: 0,
    avgRating: 0,
    avgSatisfaction: 0,
    totalRevenue: 0,
  });
  
  // Performance cache
  const [performanceCache, setPerformanceCache] = useState<Record<number, PerformanceData>>({});
  
  // Delete confirm dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number; name: string }>({
    isOpen: false, id: 0, name: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // More dropdown
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Export state
  const [exporting, setExporting] = useState(false);

  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    phone_number: '',
    vehicle_type: '',
    license_plate: '',
  });

  const fetchDeliverers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await deliverersAPI.getAll(page, 10, statusFilter, searchQuery, sortBy);
      setDeliverers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching deliverers:', error);
      toast.error('Gagal memuat data deliverer');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, sortBy]);
  
  const fetchStats = useCallback(async () => {
    try {
      const response = await deliverersAPI.getOverview();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);
  
  const fetchPerformance = async (delivererId: number) => {
    // Skip if no valid ID
    if (!delivererId || delivererId === undefined) return null;
    if (performanceCache[delivererId]) return performanceCache[delivererId];
    
    try {
      const response = await deliverersAPI.getPerformance(delivererId);
      const perfData = response.data;
      setPerformanceCache(prev => ({ ...prev, [delivererId]: perfData }));
      return perfData;
    } catch (error) {
      console.error('Error fetching performance:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchDeliverers();
    fetchStats();
  }, [fetchDeliverers, fetchStats]);
  
  // Fetch performance for visible deliverers
  useEffect(() => {
    deliverers.forEach(d => {
      if (d.deliverer_id) {
        fetchPerformance(d.deliverer_id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverers]);
  
  const getDelivererPerformance = (deliverer: DelivererProfile): PerformanceData => {
    const cached = performanceCache[deliverer.deliverer_id];
    if (cached) return cached;
    
    // Fallback while loading
    return {
      onTime: 85,
      responseTime: 3,
      satisfaction: 90,
      rebookRate: 70,
      completedOrders: deliverer.total_deliveries || 0,
      revenue: 0,
      badges: [],
    };
  };

  const handleApprove = async (deliverer: DelivererProfile) => {
    setActionLoading(true);
    try {
      await deliverersAPI.approve(deliverer.deliverer_id);
      toast.success('Deliverer berhasil disetujui!');
      fetchDeliverers();
      fetchStats();
    } catch (error) {
      console.error('Error approving deliverer:', error);
      toast.error('Gagal menyetujui deliverer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeliverer || !rejectionReason) return;
    setActionLoading(true);
    try {
      await deliverersAPI.reject(selectedDeliverer.deliverer_id, rejectionReason);
      toast.success('Deliverer berhasil ditolak');
      setIsRejectModalOpen(false);
      setSelectedDeliverer(null);
      setRejectionReason('');
      fetchDeliverers();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting deliverer:', error);
      toast.error('Gagal menolak deliverer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await deliverersAPI.register(registerForm);
      toast.success('Deliverer berhasil didaftarkan!');
      setIsRegisterModalOpen(false);
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        vehicle_type: '',
        license_plate: '',
      });
      fetchDeliverers();
      fetchStats();
    } catch (error) {
      console.error('Error registering deliverer:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal mendaftarkan deliverer');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deliverersAPI.delete(deleteConfirm.id);
      toast.success('Deliverer berhasil dihapus!');
      setDeleteConfirm({ isOpen: false, id: 0, name: '' });
      fetchDeliverers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting deliverer:', error);
      toast.error('Gagal menghapus deliverer');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      setExporting(true);
      toast.loading('Mengekspor data...', { id: 'export' });
      const response = await exportAPI.deliverers();
      
      // Ensure we have valid blob data
      const blob = response instanceof Blob ? response : new Blob([JSON.stringify(response)], { type: 'text/csv' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deliverers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data berhasil diekspor', { id: 'export' });
    } catch (error) {
      console.error('Error exporting deliverers:', error);
      toast.error('Gagal mengekspor data', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
      APPROVED: 'bg-primary-100 text-primary-700 border-primary-200',
      REJECTED: 'bg-red-100 text-red-700 border-red-200',
      ACTIVE: 'bg-primary-100 text-primary-700 border-primary-200',
      INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[status] || styles.PENDING;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Filter and sort deliverers
  const filteredDeliverers = deliverers
    .filter(d => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        d.user?.username?.toLowerCase().includes(query) ||
        d.user?.email?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const perfA = getDelivererPerformance(a);
      const perfB = getDelivererPerformance(b);
      
      switch (sortBy) {
        case 'revenue':
          return perfB.revenue - perfA.revenue;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'orders':
          return perfB.completedOrders - perfA.completedOrders;
        case 'name':
          return (a.user?.username || '').localeCompare(b.user?.username || '');
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manajemen Deliverer</h1>
          <p className="text-sm text-gray-500">Kelola dan pantau performa kurir</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{exporting ? 'Mengekspor...' : 'Export'}</span>
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-primary-500 to-teal-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all font-medium text-sm"
          >
            <UserPlus size={16} />
            <span className="hidden xs:inline">Tambah</span> <span className="hidden sm:inline">Deliverer</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatsCard
          title="Total Deliverer"
          value={stats.totalDeliverers}
          icon={Bike}
          color="primary"
          subtitle="Kurir terdaftar"
        />
        <StatsCard
          title="Aktif"
          value={stats.activeDeliverers}
          icon={Zap}
          color="blue"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Pending"
          value={stats.pendingApproval}
          icon={Clock}
          color="orange"
          subtitle="Menunggu approval"
        />
        <StatsCard
          title="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          icon={Star}
          color="pink"
          subtitle="Dari semua review"
        />
        <StatsCard
          title="Satisfaction"
          value={`${stats.avgSatisfaction}%`}
          icon={Target}
          color="purple"
          subtitle="Kepuasan pelanggan"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={BarChart3}
          color="primary"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-3 sm:px-5 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${
            activeTab === 'list'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Daftar Deliverer
          {activeTab === 'list' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-3 sm:px-5 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${
            activeTab === 'statistics'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Statistik Performa
          {activeTab === 'statistics' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-11 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-xs sm:text-sm bg-white"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-xs sm:text-sm bg-white"
              >
                <option value="revenue">Sort: Revenue</option>
                <option value="rating">Sort: Rating</option>
                <option value="orders">Sort: Orders</option>
                <option value="name">Sort: Name</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={fetchDeliverers}
              className="p-2 sm:p-2.5 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        /* Deliverer List View */
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filteredDeliverers.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center border border-gray-100">
              <Bike size={40} className="mx-auto text-gray-300 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Belum ada deliverer</h3>
              <p className="text-sm text-gray-500 mt-1">Tambahkan deliverer baru untuk memulai</p>
            </div>
          ) : (
            filteredDeliverers.map((deliverer) => {
              const perf = getDelivererPerformance(deliverer);
              return (
                <div
                  key={deliverer.deliverer_id}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
                    {/* Avatar & Info */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-linear-to-br from-primary-400 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                          <span className="text-white text-lg sm:text-xl font-bold">
                            {deliverer.user?.username?.charAt(0).toUpperCase() || 'D'}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${
                          deliverer.status === 'APPROVED' ? 'bg-green-500' : 
                          deliverer.status === 'PENDING' ? 'bg-amber-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{deliverer.user?.username || 'Unknown'}</h3>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusBadge(deliverer.status)}`}>
                            {deliverer.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center gap-1 truncate">
                            <Mail size={12} className="shrink-0" />
                            <span className="truncate">{deliverer.user?.email || 'N/A'}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Bike size={12} />
                            {deliverer.vehicle_type || '-'}
                          </span>
                        </div>
                        {/* Badges */}
                        {perf.badges.length > 0 && (
                          <div className="flex gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                            {perf.badges.map((badge, i) => (
                              <BadgeTag key={`badge-${deliverer.deliverer_id}-${badge}-${i}`} type={badge} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="flex items-center gap-3 sm:gap-6 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg sm:rounded-xl overflow-x-auto">
                      <PerformanceMetric
                        label="On Time"
                        value={`${perf.onTime}%`}
                        color="text-primary-600"
                      />
                      <PerformanceMetric
                        label="Response"
                        value={`${perf.responseTime}m`}
                        color="text-blue-600"
                      />
                      <PerformanceMetric
                        label="Satisfaction"
                        value={`${perf.satisfaction}%`}
                        color="text-purple-600"
                      />
                      <PerformanceMetric
                        label="Rebook"
                        value={`${perf.rebookRate}%`}
                        color="text-pink-600"
                      />
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-gray-800 text-sm sm:text-base">
                            {deliverer.rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{perf.completedOrders} pesanan</p>
                        <p className="text-sm font-semibold text-primary-600 mt-1">
                          {formatCurrency(perf.revenue)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDeliverer(deliverer);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 sm:p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors"
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {deliverer.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(deliverer)}
                              disabled={actionLoading}
                              className="p-2 sm:p-2.5 text-primary-600 hover:bg-primary-50 rounded-lg sm:rounded-xl transition-colors"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDeliverer(deliverer);
                                setIsRejectModalOpen(true);
                              }}
                              className="p-2 sm:p-2.5 text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === deliverer.deliverer_id ? null : deliverer.deliverer_id)}
                            className="p-2 sm:p-2.5 text-gray-400 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-colors"
                            title="More"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openDropdownId === deliverer.deliverer_id && (
                            <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                              <button
                                onClick={() => {
                                  setSelectedDeliverer(deliverer);
                                  setIsDetailModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={14} />
                                Lihat Detail
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    id: deliverer.deliverer_id,
                                    name: deliverer.user?.username || 'Deliverer'
                                  });
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                                Hapus Deliverer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 sm:gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">‹</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-primary-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Statistics View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">🏆 Top Performers</h3>
            <div className="space-y-3 sm:space-y-4">
              {deliverers.slice(0, 5).map((deliverer, index) => {
                const perf = getDelivererPerformance(deliverer);
                return (
                  <div key={`top-performer-${deliverer.deliverer_id}-${index}`} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' :
                      'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{deliverer.user?.username}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400">{perf.completedOrders} pesanan</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary-600 text-xs sm:text-sm">{formatCurrency(perf.revenue)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] sm:text-xs text-gray-500">{deliverer.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ratings Distribution */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">⭐ Distribusi Rating</h3>
            <div className="space-y-2 sm:space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = deliverers.filter(d => Math.floor(d.rating || 0) === rating).length;
                const percentage = deliverers.length > 0 ? (count / deliverers.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 sm:gap-3">
                    <span className="w-4 sm:w-6 text-xs sm:text-sm font-medium text-gray-600">{rating}</span>
                    <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                    <div className="flex-1 h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 w-8 sm:w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">📊 Rata-rata Performa</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 bg-primary-50 rounded-lg sm:rounded-xl text-center">
                <p className="text-lg sm:text-2xl font-bold text-primary-600">92%</p>
                <p className="text-[10px] sm:text-sm text-gray-500">On Time Rate</p>
              </div>
              <div className="p-2.5 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl text-center">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">3.2m</p>
                <p className="text-[10px] sm:text-sm text-gray-500">Avg Response</p>
              </div>
              <div className="p-2.5 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl text-center">
                <p className="text-lg sm:text-2xl font-bold text-purple-600">94%</p>
                <p className="text-[10px] sm:text-sm text-gray-500">Satisfaction</p>
              </div>
              <div className="p-2.5 sm:p-4 bg-pink-50 rounded-lg sm:rounded-xl text-center">
                <p className="text-lg sm:text-2xl font-bold text-pink-600">78%</p>
                <p className="text-[10px] sm:text-sm text-gray-500">Rebook Rate</p>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">📈 Status Breakdown</h3>
            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center justify-between p-2.5 sm:p-4 bg-primary-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary-500 rounded-full shrink-0" />
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Approved</span>
                </div>
                <span className="font-bold text-primary-600 text-sm sm:text-base">{stats.activeDeliverers}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-4 bg-amber-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 rounded-full shrink-0" />
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Pending</span>
                </div>
                <span className="font-bold text-amber-600 text-sm sm:text-base">{stats.pendingApproval}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full shrink-0" />
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Rejected</span>
                </div>
                <span className="font-bold text-red-600 text-sm sm:text-base">
                  {deliverers.filter(d => d.status === 'REJECTED').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDeliverer(null);
        }}
        title="Detail Deliverer"
        size="lg"
      >
        {selectedDeliverer && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-primary-400 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
                <span className="text-white text-lg sm:text-2xl font-bold">
                  {selectedDeliverer.user?.username?.charAt(0).toUpperCase() || 'D'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-xl font-bold text-gray-800 truncate">{selectedDeliverer.user?.username}</h3>
                <p className="text-gray-500 text-xs sm:text-base truncate">{selectedDeliverer.user?.email}</p>
                <span className={`inline-block mt-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusBadge(selectedDeliverer.status)}`}>
                  {selectedDeliverer.status}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Tipe Kendaraan</p>
                <p className="font-semibold text-gray-800 text-xs sm:text-base truncate">{selectedDeliverer.vehicle_type || '-'}</p>
              </div>
              <div className="p-2.5 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Plat Nomor</p>
                <p className="font-semibold text-gray-800 text-xs sm:text-base truncate">{selectedDeliverer.license_plate || '-'}</p>
              </div>
              <div className="p-2.5 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Total Pengiriman</p>
                <p className="font-semibold text-gray-800 text-xs sm:text-base">{selectedDeliverer.total_deliveries || 0}</p>
              </div>
              <div className="p-2.5 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Rating</p>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-gray-800 text-xs sm:text-base">{selectedDeliverer.rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            {selectedDeliverer.status === 'APPROVED' && (
              <div className="p-3 sm:p-4 bg-primary-50 rounded-lg sm:rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Performance Metrics</h4>
                <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
                  {(() => {
                    const perf = getDelivererPerformance(selectedDeliverer);
                    return (
                      <>
                        <div>
                          <p className="text-sm sm:text-xl font-bold text-primary-600">{perf.onTime}%</p>
                          <p className="text-[9px] sm:text-xs text-gray-500">On Time</p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-xl font-bold text-blue-600">{perf.responseTime}m</p>
                          <p className="text-[9px] sm:text-xs text-gray-500">Response</p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-xl font-bold text-purple-600">{perf.satisfaction}%</p>
                          <p className="text-[9px] sm:text-xs text-gray-500">Satisfaction</p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-xl font-bold text-pink-600">{perf.rebookRate}%</p>
                          <p className="text-[9px] sm:text-xs text-gray-500">Rebook</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedDeliverer.status === 'PENDING' && (
              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  onClick={() => {
                    handleApprove(selectedDeliverer);
                    setIsDetailModalOpen(false);
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2 sm:py-2.5 bg-primary-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsRejectModalOpen(true);
                  }}
                  className="flex-1 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedDeliverer(null);
          setRejectionReason('');
        }}
        title="Tolak Deliverer"
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Anda akan menolak <strong>{selectedDeliverer?.user?.username}</strong>. Berikan alasan penolakan:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Masukkan alasan penolakan..."
            className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            rows={4}
          />
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectionReason('');
              }}
              className="flex-1 py-2 sm:py-2.5 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason || actionLoading}
              className="flex-1 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Tolak'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Register Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Tambah Deliverer Baru"
        size="lg"
      >
        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              <input
                type="text"
                value={registerForm.phone_number}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, phone_number: e.target.value }))}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipe Kendaraan</label>
              <select
                value={registerForm.vehicle_type}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, vehicle_type: e.target.value }))}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              >
                <option value="">Pilih kendaraan</option>
                <option value="MOTORCYCLE">Motor</option>
                <option value="CAR">Mobil</option>
                <option value="BICYCLE">Sepeda</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Plat Nomor</label>
              <input
                type="text"
                value={registerForm.license_plate}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, license_plate: e.target.value }))}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="flex-1 py-2 sm:py-2.5 border border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2 sm:py-2.5 bg-primary-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Daftarkan'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: 0, name: '' })}
        onConfirm={handleDelete}
        title="Hapus Deliverer"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirm.name}"? Semua data terkait akan dihapus dan tidak dapat dikembalikan.`}
        confirmText="Hapus"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
