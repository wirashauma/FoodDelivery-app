'use client';

import { useEffect, useState } from 'react';
import { Truck, MapPin, MessageCircle, CheckCircle, Package, RefreshCw } from 'lucide-react';
import { ordersAPI } from '@/lib/api';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface Order {
  id: number;
  item_id: string;
  quantity: number;
  destination: string;
  status: string;
  created_at: string;
  final_fee?: number;
  user: {
    user_id: number;
    nama: string;
  };
}

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = async () => {
    logger.order.debug('Fetching active deliverer orders');
    try {
      const data = await ordersAPI.getMyActiveJobs();
      setOrders(data);
      logger.order.info('Active orders loaded', { count: data.length });
    } catch (error) {
      logger.order.error('Error fetching active orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.component.info('ActiveOrdersPage mounted');
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    logger.order.info('Updating order status', { orderId, newStatus });
    setUpdating(orderId);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      logger.order.info('Status updated successfully', { orderId, newStatus });
      fetchOrders();
    } catch (error) {
      logger.order.error('Error updating status', { orderId, newStatus, error });
    } finally {
      setUpdating(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OFFER_ACCEPTED':
        return 'Siap Diambil';
      case 'ON_DELIVERY':
        return 'Sedang Diantar';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OFFER_ACCEPTED':
        return 'bg-blue-100 text-blue-600';
      case 'ON_DELIVERY':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'OFFER_ACCEPTED':
        return { label: 'Mulai Pengantaran', nextStatus: 'ON_DELIVERY', color: 'bg-purple-500' };
      case 'ON_DELIVERY':
        return { label: 'Selesaikan', nextStatus: 'COMPLETED', color: 'bg-green-500' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pekerjaan Aktif</h1>
          <p className="text-gray-500">{orders.length} pekerjaan sedang berjalan</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Truck className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="font-semibold text-gray-800 mb-2">Tidak Ada Pekerjaan Aktif</h3>
          <p className="text-gray-500 mb-4">Ambil pesanan baru untuk mulai bekerja</p>
          <Link
            href="/deliverer/available"
            className="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Lihat Pesanan Tersedia
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const nextAction = getNextAction(order.status);
            
            return (
              <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${order.status === 'ON_DELIVERY' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      {order.status === 'ON_DELIVERY' ? (
                        <Truck className="text-purple-500" size={24} />
                      ) : (
                        <Package className="text-blue-500" size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">Customer: {order.user?.nama || 'User'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="font-medium text-gray-800">{order.item_id}</p>
                  <p className="text-sm text-gray-500 mt-1">Qty: {order.quantity}</p>
                  <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span>{order.destination}</span>
                  </div>
                  {order.final_fee && (
                    <p className="text-red-500 font-semibold mt-2">
                      Ongkir: {formatPrice(order.final_fee)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/deliverer/chat?orderId=${order.id}`}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Chat Customer
                  </Link>
                  
                  {nextAction && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, nextAction.nextStatus)}
                      disabled={updating === order.id}
                      className={`flex-1 py-2 ${nextAction.color} text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2`}
                    >
                      {updating === order.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : nextAction.nextStatus === 'COMPLETED' ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Truck size={18} />
                      )}
                      {nextAction.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
