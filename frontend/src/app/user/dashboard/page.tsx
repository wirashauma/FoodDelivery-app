'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, Package, MapPin, ChevronRight, Flame, Star, Bell, Gift, Search } from 'lucide-react';
import { ordersAPI, authAPI, productsAPI } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
  nama?: string;
  email: string;
}

interface OrderStats {
  total: number;
  waiting: number;
  active: number;
  completed: number;
}

interface Product {
  id: number;
  nama: string;
  harga: number;
  imageUrl: string;
  kategori: string;
}

// Category data
const categories = [
  { name: 'Makanan', icon: '🍜', color: 'from-orange-400 to-red-500' },
  { name: 'Minuman', icon: '🧃', color: 'from-blue-400 to-cyan-500' },
  { name: 'Snack', icon: '🍿', color: 'from-yellow-400 to-orange-500' },
  { name: 'Buah', icon: '🍎', color: 'from-green-400 to-emerald-500' },
  { name: 'Nasi', icon: '🍚', color: 'from-amber-400 to-yellow-500' },
  { name: 'Mie', icon: '🍝', color: 'from-red-400 to-pink-500' },
  { name: 'Ayam', icon: '🍗', color: 'from-orange-400 to-amber-500' },
  { name: 'Semua', icon: '🍽️', color: 'from-purple-400 to-indigo-500' },
];

// Promo banners
const promoBanners = [
  { id: 1, title: 'Diskon 50%', subtitle: 'Untuk Pengguna Baru', color: 'from-red-500 to-orange-500' },
  { id: 2, title: 'Gratis Ongkir', subtitle: 'Min. Pesanan 25rb', color: 'from-blue-500 to-purple-500' },
  { id: 3, title: 'Cashback 20%', subtitle: 'Pakai Voucher HEMAT20', color: 'from-green-500 to-teal-500' },
];

export default function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<OrderStats>({ total: 0, waiting: 0, active: 0, completed: 0 });
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, ordersData, productsData] = await Promise.all([
          authAPI.getProfile(),
          ordersAPI.getMyHistory(),
          productsAPI.getAll(),
        ]);
        
        setProfile(profileData);
        setPopularProducts(productsData.slice(0, 6));
        
        // Calculate stats from orders
        const orders = ordersData as Array<{ status: string }>;
        setStats({
          total: orders.length,
          waiting: orders.filter(o => o.status === 'WAITING_FOR_OFFERS').length,
          active: orders.filter(o => ['OFFER_ACCEPTED', 'ON_DELIVERY'].includes(o.status)).length,
          completed: orders.filter(o => o.status === 'COMPLETED').length,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-rotate banners
    const bannerInterval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % promoBanners.length);
    }, 4000);

    return () => clearInterval(bannerInterval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header with Search */}
      <div className="bg-linear-to-r from-orange-500 to-red-500 pt-4 pb-8 px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">👋</span>
            </div>
            <div className="text-white">
              <p className="text-sm opacity-80">{getGreeting()}</p>
              <p className="font-bold">{profile?.nama || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/20 rounded-full">
              <Bell className="text-white" size={20} />
            </button>
            <button className="p-2 bg-white/20 rounded-full">
              <Gift className="text-white" size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <Link href="/user/explore">
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-lg">
            <Search className="text-gray-400" size={20} />
            <span className="text-gray-400">Mau makan apa hari ini?</span>
          </div>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-2 mt-3 text-white/80">
          <MapPin size={14} />
          <span className="text-sm">Kampus Universitas</span>
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Content */}
      <div className="-mt-4 px-4 space-y-6">
        {/* Order Status Cards */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Pesananku</h3>
            <Link href="/user/orders" className="text-orange-500 text-sm font-medium flex items-center gap-1">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Link href="/user/orders" className="flex flex-col items-center p-3 rounded-xl hover:bg-orange-50 transition-colors">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <Package className="text-blue-500" size={20} />
              </div>
              <span className="font-bold text-gray-800">{stats.total}</span>
              <span className="text-xs text-gray-500 text-center">Total</span>
            </Link>
            <Link href="/user/orders" className="flex flex-col items-center p-3 rounded-xl hover:bg-orange-50 transition-colors">
              <div className="bg-yellow-100 p-2 rounded-full mb-2">
                <Clock className="text-yellow-500" size={20} />
              </div>
              <span className="font-bold text-gray-800">{stats.waiting}</span>
              <span className="text-xs text-gray-500 text-center">Menunggu</span>
            </Link>
            <Link href="/user/orders" className="flex flex-col items-center p-3 rounded-xl hover:bg-orange-50 transition-colors">
              <div className="bg-red-100 p-2 rounded-full mb-2">
                <ShoppingBag className="text-red-500" size={20} />
              </div>
              <span className="font-bold text-gray-800">{stats.active}</span>
              <span className="text-xs text-gray-500 text-center">Aktif</span>
            </Link>
            <Link href="/user/orders" className="flex flex-col items-center p-3 rounded-xl hover:bg-orange-50 transition-colors">
              <div className="bg-green-100 p-2 rounded-full mb-2">
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <span className="font-bold text-gray-800">{stats.completed}</span>
              <span className="text-xs text-gray-500 text-center">Selesai</span>
            </Link>
          </div>
        </div>

        {/* Promo Banner Carousel */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {promoBanners.map((banner) => (
                <div 
                  key={banner.id}
                  className={`min-w-full bg-linear-to-r ${banner.color} p-6 relative overflow-hidden`}
                >
                  <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4">
                    <Image src="/fast_food.png" alt="" width={150} height={150} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm">{banner.subtitle}</p>
                    <h3 className="text-white text-2xl font-bold mt-1">{banner.title}</h3>
                    <button className="mt-3 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
                      Klaim Sekarang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Indicators */}
          <div className="flex justify-center gap-1.5 mt-3">
            {promoBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`h-1.5 rounded-full transition-all ${
                  currentBanner === index ? 'w-6 bg-orange-500' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Kategori</h3>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => (
              <Link 
                key={category.name} 
                href={`/user/explore?category=${category.name}`}
                className="flex flex-col items-center group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${category.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="text-orange-500" size={20} />
              <h3 className="font-bold text-gray-800">Menu Populer</h3>
            </div>
            <Link href="/user/explore" className="text-orange-500 text-sm font-medium flex items-center gap-1">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {popularProducts.map((product) => (
              <Link 
                key={product.id} 
                href="/user/explore"
                className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={product.imageUrl} 
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {product.kategori}
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{product.nama}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-orange-600 font-bold text-sm">{formatPrice(product.harga)}</span>
                    <div className="flex items-center gap-0.5 text-xs text-gray-500">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span>4.8</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link 
            href="/user/explore" 
            className="bg-linear-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white relative overflow-hidden group"
          >
            <div className="absolute right-0 bottom-0 opacity-30 transform translate-x-1/4 translate-y-1/4">
              <Image src="/fast_food.png" alt="" width={100} height={100} />
            </div>
            <div className="relative z-10">
              <ShoppingBag size={24} className="mb-2" />
              <h4 className="font-bold">Pesan Sekarang</h4>
              <p className="text-xs text-white/80 mt-1">Pilih menu favoritmu</p>
            </div>
          </Link>
          <Link 
            href="/user/orders" 
            className="bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl p-4 text-white relative overflow-hidden group"
          >
            <div className="absolute right-0 bottom-0 opacity-30 transform translate-x-1/4 translate-y-1/4">
              <Package size={80} />
            </div>
            <div className="relative z-10">
              <Package size={24} className="mb-2" />
              <h4 className="font-bold">Lacak Pesanan</h4>
              <p className="text-xs text-white/80 mt-1">Cek status pesananmu</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
