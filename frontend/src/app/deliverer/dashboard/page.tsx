'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, TrendingUp } from 'lucide-react';
import { ordersAPI, authAPI } from '@/lib/api';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface DashboardStats {
  newOrders: number;
  activeOrders: number;
  completedThisMonth: number;
  totalCompleted: number;
  averageRating: number;
}

interface Profile {
  nama?: string;
  email: string;
}

export default function DelivererDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    newOrders: 0,
    activeOrders: 0,
    completedThisMonth: 0,
    totalCompleted: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.component.info('DelivererDashboard mounted');
    
    const fetchData = async () => {
      logger.api.debug('Fetching deliverer dashboard data');
      try {
        const [profileData, statsData] = await Promise.all([
          authAPI.getProfile(),
          ordersAPI.getDelivererStats(),
        ]);
        
        setProfile(profileData);
        logger.auth.debug('Profile loaded', { email: profileData?.email });
        
        if (statsData.data) {
          setStats(statsData.data);
          logger.api.info('Dashboard stats loaded', statsData.data);
        }
      } catch (error) {
        logger.api.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Pesanan Tersedia', value: stats.newOrders, icon: Package, color: 'bg-blue-500', href: '/deliverer/available' },
    { label: 'Pekerjaan Aktif', value: stats.activeOrders, icon: Truck, color: 'bg-yellow-500', href: '/deliverer/active' },
    { label: 'Selesai Bulan Ini', value: stats.completedThisMonth, icon: CheckCircle, color: 'bg-green-500', href: '/deliverer/history' },
    { label: 'Total Selesai', value: stats.totalCompleted, icon: TrendingUp, color: 'bg-purple-500', href: '/deliverer/history' },
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
        <h1 className="text-2xl font-bold">Halo, {profile?.nama || 'Deliverer'}! 🏍️</h1>
        <p className="text-red-100 mt-1">Siap untuk mengantarkan hari ini?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/deliverer/available" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-500 transition-colors">
              <Package className="text-blue-500 group-hover:text-white transition-colors" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Cari Pesanan</h3>
              <p className="text-gray-500 text-sm">Lihat pesanan yang tersedia</p>
            </div>
          </div>
        </Link>

        <Link href="/deliverer/active" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-4 rounded-xl group-hover:bg-yellow-500 transition-colors">
              <Truck className="text-yellow-500 group-hover:text-white transition-colors" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Pekerjaan Aktif</h3>
              <p className="text-gray-500 text-sm">Kelola pengantaran saat ini</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Performance Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Performa Anda</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{stats.totalCompleted}</p>
            <p className="text-sm text-gray-500 mt-1">Total Pengantaran</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Rating Rata-rata</p>
          </div>
        </div>
      </div>
    </div>
  );
}
