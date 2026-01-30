'use client';

import { useMemo } from 'react';
import { redirect, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

// Page title mapping
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  // Dashboard
  '/dashboard': { title: 'Overview', subtitle: 'Ringkasan bisnis dan statistik terbaru' },
  
  // OMS - Order Management System
  '/oms': { title: 'Live Monitor', subtitle: 'Pantau pesanan secara real-time' },
  '/orders': { title: 'Semua Pesanan', subtitle: 'Kelola dan lihat riwayat pesanan' },
  
  // Merchants
  '/merchants': { title: 'Daftar Merchant', subtitle: 'Kelola merchant dan restoran mitra' },
  '/merchants/verification': { title: 'Verifikasi Merchant', subtitle: 'Verifikasi dokumen dan kelola status merchant' },
  
  // Deliverers
  '/deliverers': { title: 'Daftar Driver', subtitle: 'Kelola driver dan kurir mitra' },
  '/deliverers/verification': { title: 'Verifikasi Driver', subtitle: 'Verifikasi dokumen dan aktifkan akun driver' },
  
  // Promos & Marketing
  '/promos': { title: 'Promo', subtitle: 'Kelola kampanye promosi dan diskon' },
  '/promos/banners': { title: 'Banner', subtitle: 'Kelola banner promosi di aplikasi' },
  '/promos/vouchers': { title: 'Voucher', subtitle: 'Kelola dan generate kode voucher' },
  
  // Financial
  '/financial': { title: 'Financial Overview', subtitle: 'Ringkasan keuangan dan laporan' },
  '/financial/merchant-payouts': { title: 'Payout Merchant', subtitle: 'Kelola pembayaran ke merchant' },
  '/financial/driver-payouts': { title: 'Payout Driver', subtitle: 'Kelola pembayaran ke driver' },
  '/financial/refunds': { title: 'Refund', subtitle: 'Kelola permintaan pengembalian dana' },
  '/earnings': { title: 'Pendapatan', subtitle: 'Laporan pendapatan dan revenue' },
  
  // Master Data
  '/master-data/categories': { title: 'Kategori', subtitle: 'Kelola kategori produk dan merchant' },
  '/master-data/cuisine-types': { title: 'Jenis Masakan', subtitle: 'Kelola jenis masakan dan cuisine' },
  '/master-data/delivery-zones': { title: 'Zona Pengiriman', subtitle: 'Kelola area dan biaya pengiriman' },
  '/master-data/settings': { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi sistem dan parameter' },
  
  // Users & Support
  '/users': { title: 'Users', subtitle: 'Kelola akun pengguna' },
  '/complaints': { title: 'Keluhan', subtitle: 'Kelola keluhan dan laporan pengguna' },
  
  // Settings
  '/settings': { title: 'Pengaturan', subtitle: 'Kelola preferensi dan akun Anda' },
  
  // Legacy routes
  '/products': { title: 'Produk', subtitle: 'Kelola restoran dan menu makanan' },
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  const isAuthenticated = useMemo(() => {
    const adminToken = Cookies.get('adminToken');
    const authToken = Cookies.get('authToken');
    const userRole = Cookies.get('userRole');
    return !!adminToken || (!!authToken && userRole === 'ADMIN');
  }, []);

  if (!isAuthenticated) {
    redirect('/auth');
  }

  const pageInfo = useMemo(() => {
    // First try exact match
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    // Then try to find the best matching parent route
    const matchingRoute = Object.keys(pageTitles)
      .filter(route => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0];
    
    return matchingRoute 
      ? pageTitles[matchingRoute] 
      : { title: 'Admin Panel', subtitle: '' };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="p-3 sm:p-4 md:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
