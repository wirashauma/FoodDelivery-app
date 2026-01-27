'use client';

import { useEffect, useState } from 'react';
import { Package, MapPin, Clock, Send, RefreshCw } from 'lucide-react';
import { ordersAPI, offersAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Order {
  id: number;
  item_id: string;
  quantity: number;
  destination: string;
  status: string;
  created_at: string;
  user: {
    nama: string;
  };
}

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [offerFee, setOfferFee] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchOrders = async () => {
    logger.order.debug('Fetching available orders');
    try {
      const data = await ordersAPI.getAvailable();
      setOrders(data);
      logger.order.info('Available orders loaded', { count: data.length });
    } catch (error) {
      logger.order.error('Error fetching available orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.component.info('AvailableOrdersPage mounted');
    fetchOrders();
  }, []);

  const handleSubmitOffer = async () => {
    if (!selectedOrder || !offerFee) return;

    const fee = parseInt(offerFee);
    if (isNaN(fee) || fee <= 0) {
      logger.order.warn('Invalid offer fee', { offerFee });
      setMessage({ type: 'error', text: 'Masukkan jumlah yang valid' });
      return;
    }

    logger.order.info('Submitting offer', { orderId: selectedOrder.id, fee });
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await offersAPI.create(selectedOrder.id, fee);
      logger.order.info('Offer submitted successfully', { orderId: selectedOrder.id, fee });
      setMessage({ type: 'success', text: 'Tawaran berhasil dikirim!' });
      setSelectedOrder(null);
      setOfferFee('');
      fetchOrders();
    } catch (error) {
      logger.order.error('Error submitting offer', { orderId: selectedOrder.id, error });
      setMessage({ type: 'error', text: 'Gagal mengirim tawaran' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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
          <h1 className="text-2xl font-bold text-gray-800">Pesanan Tersedia</h1>
          <p className="text-gray-500">{orders.length} pesanan menunggu tawaran</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="font-semibold text-gray-800 mb-2">Tidak Ada Pesanan</h3>
          <p className="text-gray-500">Belum ada pesanan yang tersedia saat ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.id}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock size={14} />
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">
                  Baru
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="font-medium text-gray-800 text-sm">{order.item_id}</p>
                <p className="text-xs text-gray-500 mt-1">Qty: {order.quantity}</p>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span>{order.destination}</span>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                Pemesan: <span className="font-medium text-gray-800">{order.user?.nama || 'User'}</span>
              </div>

              <button
                onClick={() => setSelectedOrder(order)}
                className="w-full py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Buat Tawaran
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Buat Tawaran</h3>
              <p className="text-sm text-gray-500">Order #{selectedOrder.id}</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800">{selectedOrder.item_id}</p>
                <p className="text-sm text-gray-500 mt-1">📍 {selectedOrder.destination}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ongkos Kirim (Rp)
                </label>
                <input
                  type="number"
                  value={offerFee}
                  onChange={(e) => setOfferFee(e.target.value)}
                  placeholder="Contoh: 10000"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {offerFee && !isNaN(parseInt(offerFee)) && (
                  <p className="text-sm text-gray-500 mt-2">
                    Anda akan menawarkan: <span className="font-semibold text-red-500">{formatPrice(parseInt(offerFee))}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setSelectedOrder(null); setOfferFee(''); }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={submitting || !offerFee}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Mengirim...' : 'Kirim Tawaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
