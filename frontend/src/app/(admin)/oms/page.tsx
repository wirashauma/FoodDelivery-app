'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  User,
  Store,
  Truck,
  MapPin,
  RefreshCw,
  Phone,
  ChefHat,
  Navigation,
  Package,
} from 'lucide-react';
import { OrderStatus } from '@/types/admin';

// Dummy live stats
const liveStats = {
  total: 47,
  pending: 5,
  confirmed: 8,
  preparing: 12,
  readyForPickup: 6,
  onTheWay: 14,
  delivered: 2,
  cancelled: 0,
  averageDeliveryTime: 32,
  revenueToday: 12450000,
};

// Dummy orders
const dummyOrders = [
  {
    id: 'ORD-2024-001',
    orderNumber: '#TTP-2024-001',
    status: OrderStatus.PENDING,
    customerName: 'Ahmad Rizki',
    customerPhone: '081234567890',
    merchantName: 'Warung Padang Sederhana',
    driverName: null,
    total: 85000,
    items: 3,
    deliveryAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedDelivery: '15:30',
  },
  {
    id: 'ORD-2024-002',
    orderNumber: '#TTP-2024-002',
    status: OrderStatus.CONFIRMED,
    customerName: 'Sarah Wijaya',
    customerPhone: '081234567891',
    merchantName: 'Sushi Tei Express',
    driverName: null,
    total: 245000,
    items: 5,
    deliveryAddress: 'Jl. Thamrin No. 456, Jakarta Pusat',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    estimatedDelivery: '15:45',
  },
  {
    id: 'ORD-2024-003',
    orderNumber: '#TTP-2024-003',
    status: OrderStatus.PREPARING,
    customerName: 'Budi Santoso',
    customerPhone: '081234567892',
    merchantName: 'Ayam Geprek Bensu',
    driverName: null,
    total: 65000,
    items: 2,
    deliveryAddress: 'Jl. Kuningan No. 321, Jakarta Selatan',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    estimatedDelivery: '15:50',
  },
  {
    id: 'ORD-2024-004',
    orderNumber: '#TTP-2024-004',
    status: OrderStatus.READY_FOR_PICKUP,
    customerName: 'Dewi Lestari',
    customerPhone: '081234567893',
    merchantName: 'Kedai Kopi Nusantara',
    driverName: 'Joko Driver',
    total: 42000,
    items: 2,
    deliveryAddress: 'Jl. Kemang Raya No. 567, Jakarta Selatan',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    estimatedDelivery: '15:35',
  },
  {
    id: 'ORD-2024-005',
    orderNumber: '#TTP-2024-005',
    status: OrderStatus.ON_THE_WAY,
    customerName: 'Eko Prasetyo',
    customerPhone: '081234567894',
    merchantName: 'Bakso Solo Pak Min',
    driverName: 'Andi Driver',
    total: 55000,
    items: 3,
    deliveryAddress: 'Jl. Rasuna Said No. 890, Jakarta Selatan',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    estimatedDelivery: '15:25',
  },
  {
    id: 'ORD-2024-006',
    orderNumber: '#TTP-2024-006',
    status: OrderStatus.DRIVER_ARRIVED,
    customerName: 'Rina Kusuma',
    customerPhone: '081234567895',
    merchantName: 'Warung Padang Sederhana',
    driverName: 'Bambang Driver',
    total: 92000,
    items: 4,
    deliveryAddress: 'Jl. HR Rasuna Said No. 111, Jakarta Selatan',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    estimatedDelivery: '15:20',
  },
];

const statusConfig: Record<string, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ElementType;
  label: string;
}> = {
  [OrderStatus.PENDING]: { 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50', 
    borderColor: 'border-yellow-200',
    icon: Clock,
    label: 'Menunggu Konfirmasi'
  },
  [OrderStatus.CONFIRMED]: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    icon: CheckCircle2,
    label: 'Dikonfirmasi'
  },
  [OrderStatus.PREPARING]: { 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50', 
    borderColor: 'border-orange-200',
    icon: ChefHat,
    label: 'Sedang Disiapkan'
  },
  [OrderStatus.READY_FOR_PICKUP]: { 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200',
    icon: Package,
    label: 'Siap Diambil'
  },
  [OrderStatus.ON_THE_WAY]: { 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-50', 
    borderColor: 'border-cyan-200',
    icon: Navigation,
    label: 'Dalam Perjalanan'
  },
  [OrderStatus.DRIVER_ARRIVED]: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: MapPin,
    label: 'Driver Sampai'
  },
  [OrderStatus.DELIVERED]: { 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50', 
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
    label: 'Terkirim'
  },
  [OrderStatus.CANCELLED]: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    icon: XCircle,
    label: 'Dibatalkan'
  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} jam lalu`;
}

function OrderCard({ order }: { order: typeof dummyOrders[0] }) {
  const config = statusConfig[order.status] || statusConfig[OrderStatus.PENDING];
  const StatusIcon = config.icon;

  return (
    <div className={`bg-white rounded-xl border-2 ${config.borderColor} p-4 hover:shadow-md transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{order.orderNumber}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
            <StatusIcon size={12} />
            {config.label}
          </span>
        </div>
        <span className="text-xs text-gray-500">{formatTimeAgo(order.createdAt)}</span>
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-2 mb-2">
        <User size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{order.customerName}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-500">{order.customerPhone}</span>
      </div>

      {/* Merchant Info */}
      <div className="flex items-center gap-2 mb-2">
        <Store size={14} className="text-gray-400" />
        <span className="text-sm text-gray-600">{order.merchantName}</span>
      </div>

      {/* Driver Info */}
      {order.driverName && (
        <div className="flex items-center gap-2 mb-2">
          <Truck size={14} className="text-primary-500" />
          <span className="text-sm text-primary-600 font-medium">{order.driverName}</span>
        </div>
      )}

      {/* Delivery Address */}
      <div className="flex items-start gap-2 mb-3">
        <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
        <span className="text-xs text-gray-500 line-clamp-2">{order.deliveryAddress}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
          <span className="text-xs text-gray-500 ml-1">({order.items} item)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">ETA: {order.estimatedDelivery}</span>
        </div>
      </div>
    </div>
  );
}

export default function OMSPage() {
  const [orders, setOrders] = useState(dummyOrders);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === selectedFilter);

  const statusCounts = {
    all: orders.length,
    [OrderStatus.PENDING]: orders.filter(o => o.status === OrderStatus.PENDING).length,
    [OrderStatus.CONFIRMED]: orders.filter(o => o.status === OrderStatus.CONFIRMED).length,
    [OrderStatus.PREPARING]: orders.filter(o => o.status === OrderStatus.PREPARING).length,
    [OrderStatus.READY_FOR_PICKUP]: orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).length,
    [OrderStatus.ON_THE_WAY]: orders.filter(o => o.status === OrderStatus.ON_THE_WAY).length,
    [OrderStatus.DRIVER_ARRIVED]: orders.filter(o => o.status === OrderStatus.DRIVER_ARRIVED).length,
  };

  return (
    <div className="space-y-6">
      {/* Live Stats Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold text-gray-700">Live Monitor</span>
            <span className="text-xs text-gray-400">
              Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{liveStats.total}</p>
            <p className="text-xs text-gray-500">Total Aktif</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{liveStats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{liveStats.preparing}</p>
            <p className="text-xs text-gray-500">Preparing</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{liveStats.readyForPickup}</p>
            <p className="text-xs text-gray-500">Ready</p>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded-lg">
            <p className="text-2xl font-bold text-cyan-600">{liveStats.onTheWay}</p>
            <p className="text-xs text-gray-500">On The Way</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(liveStats.revenueToday)}</p>
            <p className="text-xs text-gray-500">Revenue Hari Ini</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedFilter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Semua ({statusCounts.all})
        </button>
        {Object.entries(statusConfig).slice(0, 6).map(([status, config]) => {
          const count = statusCounts[status as keyof typeof statusCounts] || 0;
          return (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedFilter === status
                  ? `${config.bgColor} ${config.color} border-2 ${config.borderColor}`
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <config.icon size={14} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Tidak ada pesanan dengan status ini</p>
        </div>
      )}
    </div>
  );
}
