'use client';

import { useMemo } from 'react';
import { redirect } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useMemo(() => {
    // Check both old adminToken and new unified auth tokens
    const adminToken = Cookies.get('adminToken');
    const authToken = Cookies.get('authToken');
    const userRole = Cookies.get('userRole');
    
    // Valid if has old admin token OR has new auth with ADMIN role
    return !!adminToken || (!!authToken && userRole === 'ADMIN');
  }, []);

  if (!isAuthenticated) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
