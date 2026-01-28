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
  '/dashboard': { title: 'Overview', subtitle: 'Ringkasan bisnis dan statistik terbaru' },
  '/orders': { title: 'Pesanan', subtitle: 'Kelola semua pesanan masuk' },
  '/products': { title: 'Produk', subtitle: 'Kelola restoran dan menu makanan' },
  '/deliverers': { title: 'Deliverer', subtitle: 'Kelola dan pantau performa kurir' },
  '/users': { title: 'Users', subtitle: 'Kelola akun pengguna' },
  '/earnings': { title: 'Pendapatan', subtitle: 'Laporan keuangan dan revenue' },
  '/settings': { title: 'Pengaturan', subtitle: 'Kelola preferensi dan akun Anda' },
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

  const pageInfo = pageTitles[pathname] || { title: 'Admin Panel', subtitle: '' };

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
