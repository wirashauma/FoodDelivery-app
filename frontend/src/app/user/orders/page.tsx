'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, Truck, Package, MessageCircle, RefreshCw } from 'lucide-react';
import { ordersAPI, offersAPI } from '@/lib/api';
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
  deliverer?: {
    user_id: number;
    nama: string;
  };
}

interface Offer {
  id: number;
  fee: number;
  deliverer_id: number;
  deliverer: {
    nama: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [acceptingOffer, setAcceptingOffer] = useState<number | null>(null);

  const fetchOrders = async () => {
    logger.order.debug('Fetching user orders');
    try {
      const data = await ordersAPI.getMyHistory();
      setOrders(data);
      logger.order.info('Orders loaded', { count: data.length });
    } catch (error) {
      logger.order.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.component.info('OrdersPage mounted');
    fetchOrders();
  }, []);

  const fetchOffers = async (orderId: number) => {
    logger.order.debug('Fetching offers for order', { orderId });
    setLoadingOffers(true);
    try {
      const data = await ordersAPI.getOrderOffers(orderId);
      setOffers(data);
      logger.order.info('Offers loaded', { orderId, count: data.length });
    } catch (error) {
      logger.order.error('Error fetching offers', { orderId, error });
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleViewOffers = async (order: Order) => {
    logger.order.info('Viewing offers', { orderId: order.id });
    setSelectedOrder(order);
    await fetchOffers(order.id);
  };

  const handleAcceptOffer = async (offerId: number) => {
    logger.order.info('Accepting offer', { offerId });
    setAcceptingOffer(offerId);
    try {
      await offersAPI.accept(offerId);
      logger.order.info('Offer accepted successfully', { offerId });
      await fetchOrders();
      setSelectedOrder(null);
      setOffers([]);
    } catch (error) {
      logger.order.error('Error accepting offer', { offerId, error });
    } finally {
      setAcceptingOffer(null);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_OFFERS':
        return <Clock className="text-yellow-500" size={20} />;
      case 'OFFER_ACCEPTED':
        return <Package className="text-blue-500" size={20} />;
      case 'ON_DELIVERY':
        return <Truck className="text-purple-500" size={20} />;
      case 'COMPLETED':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Package className="text-gray-500" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_OFFERS':
        return 'Menunggu Tawaran';
      case 'OFFER_ACCEPTED':
        return 'Tawaran Diterima';
      case 'ON_DELIVERY':
        return 'Sedang Diantar';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_OFFERS':
        return 'bg-yellow-100 text-yellow-600';
      case 'OFFER_ACCEPTED':
        return 'bg-blue-100 text-blue-600';
      case 'ON_DELIVERY':
        return 'bg-purple-100 text-purple-600';
      case 'COMPLETED':
        return 'bg-green-100 text-green-600';
      case 'CANCELLED':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Pesanan</h1>
          <p className="text-gray-500">{orders.length} pesanan</p>
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
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="font-semibold text-gray-800 mb-2">Belum Ada Pesanan</h3>
          <p className="text-gray-500 mb-4">Mulai pesan makanan favoritmu!</p>
          <Link
            href="/user/explore"
            className="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Jelajahi Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-semibold text-gray-800">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-800">{order.item_id}</p>
                <p className="text-sm text-gray-500 mt-1">Qty: {order.quantity}</p>
                <p className="text-sm text-gray-500">📍 {order.destination}</p>
                {order.final_fee && (
                  <p className="text-red-500 font-semibold mt-2">
                    Ongkir: {formatPrice(order.final_fee)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {order.status === 'WAITING_FOR_OFFERS' && (
                  <button
                    onClick={() => handleViewOffers(order)}
                    className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Lihat Tawaran
                  </button>
                )}
                
                {['OFFER_ACCEPTED', 'ON_DELIVERY'].includes(order.status) && order.deliverer && (
                  <Link
                    href={`/user/chat?orderId=${order.id}`}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Chat Deliverer
                  </Link>
                )}
              </div>

              {order.deliverer && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Deliverer: <span className="font-medium text-gray-800">{order.deliverer.nama}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Offers Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Tawaran untuk Order #{selectedOrder.id}</h3>
              <p className="text-sm text-gray-500">{selectedOrder.item_id}</p>
            </div>
            
            <div className="p-5 max-h-96 overflow-y-auto">
              {loadingOffers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto text-gray-300 mb-2" size={48} />
                  <p className="text-gray-500">Belum ada tawaran</p>
                  <p className="text-sm text-gray-400">Tunggu sebentar ya...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map(offer => (
                    <div key={offer.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-800">{offer.deliverer.nama}</p>
                          <p className="text-red-500 font-bold text-lg">{formatPrice(offer.fee)}</p>
                        </div>
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={acceptingOffer === offer.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {acceptingOffer === offer.id ? 'Memproses...' : 'Terima'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => { setSelectedOrder(null); setOffers([]); }}
                className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
