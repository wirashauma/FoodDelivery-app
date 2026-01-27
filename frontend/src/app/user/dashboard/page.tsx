'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, Package } from 'lucide-react';
import { ordersAPI, authAPI } from '@/lib/api';
import Link from 'next/link';

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

export default function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<OrderStats>({ total: 0, waiting: 0, active: 0, completed: 0 });
  const [recentOrders, setRecentOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, ordersData] = await Promise.all([
          authAPI.getProfile(),
          ordersAPI.getMyHistory(),
        ]);
        
        setProfile(profileData);
        setRecentOrders(ordersData.slice(0, 5));
        
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
  }, []);

  const statCards = [
    { label: 'Total Pesanan', value: stats.total, icon: Package, color: 'bg-blue-500' },
    { label: 'Menunggu Tawaran', value: stats.waiting, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Sedang Aktif', value: stats.active, icon: ShoppingBag, color: 'bg-red-500' },
    { label: 'Selesai', value: stats.completed, icon: CheckCircle, color: 'bg-green-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-linear-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Selamat Datang, {profile?.nama || 'User'}! 👋</h1>
        <p className="text-red-100 mt-1">Mau pesan apa hari ini?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/user/explore" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-4 rounded-xl group-hover:bg-red-500 transition-colors">
              <ShoppingBag className="text-red-500 group-hover:text-white transition-colors" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Jelajahi Menu</h3>
              <p className="text-gray-500 text-sm">Temukan makanan favoritmu</p>
            </div>
          </div>
        </Link>

        <Link href="/user/orders" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-500 transition-colors">
              <Clock className="text-blue-500 group-hover:text-white transition-colors" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Lihat Pesanan</h3>
              <p className="text-gray-500 text-sm">Pantau status pesananmu</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pesanan Terbaru</h2>
        </div>
        <div className="p-5">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">{order.item_id as string}</p>
                    <p className="text-sm text-gray-500">{order.destination as string}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                    order.status === 'ON_DELIVERY' ? 'bg-blue-100 text-blue-600' :
                    order.status === 'WAITING_FOR_OFFERS' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
