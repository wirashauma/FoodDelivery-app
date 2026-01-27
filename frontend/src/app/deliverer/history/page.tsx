'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, RefreshCw, DollarSign } from 'lucide-react';
import { ordersAPI } from '@/lib/api';

interface Order {
  id: number;
  item_id: string;
  quantity: number;
  destination: string;
  status: string;
  created_at: string;
  final_fee?: number;
  user: {
    nama: string;
  };
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getDelivererCompleted(50, 0);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalEarnings = orders.reduce((sum, order) => sum + (order.final_fee || 0), 0);

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
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengantaran</h1>
          <p className="text-gray-500">{orders.length} pengantaran selesai</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Total Earnings Card */}
      <div className="bg-linear-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-green-100">Total Pendapatan</p>
            <p className="text-3xl font-bold">{formatPrice(totalEarnings)}</p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <CheckCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="font-semibold text-gray-800 mb-2">Belum Ada Riwayat</h3>
          <p className="text-gray-500">Pengantaran yang selesai akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <span className="text-green-500 font-bold">
                  +{formatPrice(order.final_fee || 0)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-800 text-sm">{order.item_id}</p>
                <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <span>{order.destination}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Customer: {order.user?.nama || 'User'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
