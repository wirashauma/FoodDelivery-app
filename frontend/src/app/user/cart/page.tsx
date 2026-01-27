'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, MapPin } from 'lucide-react';
import { ordersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface Product {
  id: number;
  nama: string;
  harga: number;
  imageUrl: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    logger.cart.debug('CartPage mounted, loading cart from localStorage');
    const savedCart = localStorage.getItem('titipin_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      logger.cart.info('Cart loaded', { itemCount: parsedCart.length });
    } else {
      logger.cart.debug('No saved cart found');
    }
  }, []);

  const updateQuantity = (productId: number, delta: number) => {
    logger.cart.debug('Updating quantity', { productId, delta });
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: Math.max(0, newQuantity) };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(newCart);
    localStorage.setItem('titipin_cart', JSON.stringify(newCart));
    logger.cart.info('Cart updated', { itemCount: newCart.length });
  };

  const removeItem = (productId: number) => {
    logger.cart.info('Removing item from cart', { productId });
    const newCart = cart.filter(item => item.product.id !== productId);
    setCart(newCart);
    localStorage.setItem('titipin_cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    logger.cart.info('Clearing entire cart');
    setCart([]);
    localStorage.removeItem('titipin_cart');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.harga * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrder = async () => {
    logger.order.info('Initiating order', { totalItems, subtotal, address: address.trim() ? 'provided' : 'missing' });
    
    if (!address.trim()) {
      logger.order.warn('Order failed: missing address');
      setError('Alamat pengantaran wajib diisi!');
      return;
    }

    if (cart.length === 0) {
      logger.order.warn('Order failed: empty cart');
      setError('Keranjang kosong!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const itemSummary = cart.map(item => `${item.product.nama} x${item.quantity}`).join('; ');
      
      logger.order.debug('Creating order', { itemSummary, totalItems, destination: address });
      const response = await ordersAPI.create({
        itemId: itemSummary,
        quantity: totalItems,
        destination: address,
      });
      
      logger.order.info('Order created successfully', { orderId: response.data?.id });

      // Clear cart after successful order
      clearCart();
      
      // Redirect to orders page
      logger.navigation.info('Redirecting to orders page', { orderId: response.data?.id });
      router.push(`/user/orders?newOrder=${response.data.id}`);
    } catch (error) {
      logger.order.error('Error creating order', error);
      setError('Gagal membuat pesanan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Keranjang</h1>
        <p className="text-gray-500">{totalItems} item dalam keranjang</p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="font-semibold text-gray-800 mb-2">Keranjang Kosong</h3>
          <p className="text-gray-500 mb-4">Yuk mulai tambahkan menu favoritmu!</p>
          <button
            onClick={() => router.push('/user/explore')}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Jelajahi Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.product.id} className="bg-white rounded-xl p-4 flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.product.nama}</h3>
                      <p className="text-red-500 font-medium mt-1">{formatPrice(item.product.harga)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="ml-auto font-semibold text-gray-800">
                      {formatPrice(item.product.harga * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h3>
              
              {/* Address Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Alamat Pengantaran
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap..."
                  rows={3}
                  className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} item)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span className="text-sm text-gray-400">Ditentukan deliverer</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-red-500">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleOrder}
                disabled={loading || cart.length === 0}
                className="w-full mt-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  'Pesan Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
