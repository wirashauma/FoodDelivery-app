'use client';

import { useMemo } from 'react';
import { redirect, usePathname, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { UserRole, isAdminRole, canAccessPath, ROLE_DISPLAY_NAMES } from '@/lib/rbac';

// Page title mapping - supports both pathname and pathname with query params
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  // Dashboard
  '/dashboard': { title: 'Overview', subtitle: 'Ringkasan bisnis dan statistik terbaru' },
  
  // OMS - Order Management System
  '/oms': { title: 'Live Monitor', subtitle: 'Pantau pesanan secara real-time' },
  '/orders': { title: 'Semua Pesanan', subtitle: 'Kelola dan lihat riwayat pesanan' },
  
  // Merchants
  '/merchants': { title: 'Daftar Merchant', subtitle: 'Kelola merchant dan restoran mitra' },
  '/merchants?filter=pending': { title: 'Verifikasi Merchant', subtitle: 'Verifikasi dokumen dan kelola status merchant' },
  
  // Deliverers
  '/deliverers': { title: 'Daftar Driver', subtitle: 'Kelola driver dan kurir mitra' },
  '/deliverers/verification': { title: 'Verifikasi Driver', subtitle: 'Verifikasi dokumen dan aktifkan akun driver' },
  
  // Promos & Marketing
  '/promos': { title: 'Promo', subtitle: 'Kelola kampanye promosi dan diskon' },
  '/promos?tab=banners': { title: 'Banner', subtitle: 'Kelola banner promosi di aplikasi' },
  '/promos?tab=vouchers': { title: 'Voucher', subtitle: 'Kelola dan generate kode voucher' },
  
  // Financial
  '/financial': { title: 'Financial Overview', subtitle: 'Ringkasan keuangan dan laporan' },
  '/financial?tab=merchant': { title: 'Payout Merchant', subtitle: 'Kelola pembayaran ke merchant' },
  '/financial?tab=driver': { title: 'Payout Driver', subtitle: 'Kelola pembayaran ke driver' },
  '/financial?tab=refund': { title: 'Refund', subtitle: 'Kelola permintaan pengembalian dana' },
  '/earnings': { title: 'Pendapatan', subtitle: 'Laporan pendapatan dan revenue' },
  
  // Master Data
  '/master-data/categories': { title: 'Kategori', subtitle: 'Kelola kategori produk dan merchant' },
  '/master-data/categories?tab=cuisines': { title: 'Jenis Masakan', subtitle: 'Kelola jenis masakan dan cuisine' },
  '/master-data/categories?tab=zones': { title: 'Zona Pengiriman', subtitle: 'Kelola area dan biaya pengiriman' },
  '/master-data/categories?tab=settings': { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi sistem dan parameter' },
  
  // Users & Support
  '/users': { title: 'Users', subtitle: 'Kelola akun pengguna' },
  '/complaints': { title: 'Keluhan', subtitle: 'Kelola keluhan dan laporan pengguna' },
  
  // Settings
  '/settings': { title: 'Pengaturan', subtitle: 'Kelola preferensi dan akun Anda' },
  
  // Legacy routes
  '/products': { title: 'Produk', subtitle: 'Kelola restoran dan menu makanan' },
  
  // Merchant Pages
  '/merchant/dashboard': { title: 'Dashboard Merchant', subtitle: 'Ringkasan toko dan statistik' },
  '/merchant/profile': { title: 'Profil Toko', subtitle: 'Kelola informasi toko Anda' },
  '/merchant/products': { title: 'Produk Saya', subtitle: 'Kelola menu dan produk' },
  '/merchant/orders': { title: 'Pesanan', subtitle: 'Kelola pesanan masuk' },
  '/merchant/earnings': { title: 'Pendapatan', subtitle: 'Lihat laporan pendapatan' },
  '/merchant/payouts': { title: 'Pencairan', subtitle: 'Ajukan pencairan dana' },
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();
  
  // Check authentication and role access
  const authInfo = useMemo(() => {
    const adminToken = Cookies.get('adminToken');
    const authToken = Cookies.get('authToken');
    const userRole = Cookies.get('userRole') as UserRole | undefined;
    
    // Must have either adminToken or authToken
    if (!adminToken && !authToken) {
      return { isAuthenticated: false, hasAccess: false, role: undefined };
    }
    
    // Check if user has admin-level role
    const hasAdminAccess = isAdminRole(userRole);
    
    return { 
      isAuthenticated: true, 
      hasAccess: hasAdminAccess,
      role: userRole 
    };
  }, []);

  // Redirect if not authenticated
  if (!authInfo.isAuthenticated) {
    redirect('/auth');
  }

  // Redirect if doesn't have admin access
  if (!authInfo.hasAccess) {
    // Redirect non-admin roles to their appropriate pages
    const role = authInfo.role;
    if (role === 'CUSTOMER') {
      redirect('/user');
    } else if (role === 'DELIVERER') {
      redirect('/deliverer');
    }
    redirect('/auth');
  }

  // Check if user can access the current path
  const queryString = searchParams.toString();
  const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
  
  if (!canAccessPath(authInfo.role, pathname)) {
    // Redirect to dashboard if trying to access unauthorized page
    redirect('/dashboard');
  }

  const pageInfo = useMemo(() => {
    // Build full path with query params
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
    
    // First try exact match with query params
    if (pageTitles[fullPath]) {
      return pageTitles[fullPath];
    }
    
    // Then try pathname only match
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    
    // Then try to find the best matching parent route
    const matchingRoute = Object.keys(pageTitles)
      .filter(route => {
        const [routePath] = route.split('?');
        return pathname.startsWith(routePath);
      })
      .sort((a, b) => b.length - a.length)[0];
    
    return matchingRoute 
      ? pageTitles[matchingRoute] 
      : { title: 'Admin Panel', subtitle: '' };
  }, [pathname, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className={`${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
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
