'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle, ChefHat, Package, Truck, Search, RefreshCw } from 'lucide-react';
import { merchantAPI } from '@/lib/api';

interface OrderItem {
  name?: string;
  productName?: string;
  quantity: number;
  price: number;
  product?: {
    nama?: string;
    harga?: number;
  };
}

interface Order {
  id: number;
  orderNumber?: string;
  status: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  items?: OrderItem[];
  customer?: {
    id?: number;
    fullName?: string;
    name?: string;
    phone?: string;
  };
  createdAt: string;
  notes?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PREPARING: { label: 'Diproses', color: 'bg-blue-100 text-blue-800', icon: ChefHat },
  READY_FOR_PICKUP: { label: 'Siap Diambil', color: 'bg-purple-100 text-purple-800', icon: Package },
  PICKED_UP: { label: 'Diambil', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  DELIVERED: { label: 'Dikirim', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function MerchantOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await merchantAPI.getOrders();
      const data = Array.isArray(res) ? res : [];
      // Sort by date descending
      data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      await merchantAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Gagal mengupdate status pesanan');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.id).includes(searchQuery) ||
      order.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group orders by status for tabs
  const orderCounts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PREPARING: orders.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)).length,
    READY: orders.filter(o => o.status === 'READY_FOR_PICKUP').length,
    COMPLETED: orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
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
      {/* Header with Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
          />
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'ALL', label: 'Semua' },
          { key: 'PENDING', label: 'Menunggu' },
          { key: 'PREPARING', label: 'Diproses' },
          { key: 'READY', label: 'Siap' },
          { key: 'COMPLETED', label: 'Selesai' },
          { key: 'CANCELLED', label: 'Dibatalkan' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              statusFilter === tab.key ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {orderCounts[tab.key as keyof typeof orderCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const StatusIcon = statusConfig[order.status]?.icon || Clock;
          
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order Header */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Order #{order.orderNumber || String(order.id).substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[order.status]?.label || order.status}
                  </span>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-4">
                {/* Customer Info */}
                {order.customer && (
                  <div className="mb-3 text-sm">
                    <p className="font-medium text-gray-700">{order.customer.fullName || order.customer.name || 'Customer'}</p>
                    {order.customer.phone && <p className="text-gray-500">{order.customer.phone}</p>}
                  </div>
                )}

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-2">{order.items.length} item</p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item: OrderItem, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.product?.nama || item.name || item.productName}</span>
                          <span className="text-gray-500">{formatCurrency((item.product?.harga || item.price) * item.quantity)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-400">+{order.items.length - 3} item lainnya</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">📝 {order.notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-medium text-gray-700">Total</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(order.subtotal || order.total || 0)}</span>
                </div>
              </div>

              {/* Order Actions */}
              {['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status) && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                        disabled={updatingOrder === order.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Konfirmasi
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        disabled={updatingOrder === order.id}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      disabled={updatingOrder === order.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      <ChefHat className="w-4 h-4" />
                      Mulai Proses
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                      disabled={updatingOrder === order.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      <Package className="w-4 h-4" />
                      Siap Diambil
                    </button>
                  )}
                  {order.status === 'READY_FOR_PICKUP' && (
                    <p className="flex-1 text-center text-sm text-gray-500 py-2">
                      Menunggu driver mengambil pesanan...
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Tidak ada pesanan</h3>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter !== 'ALL' ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan masuk'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
