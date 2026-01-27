'use client';

import { useMemo } from 'react';
import { redirect } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingBag, 
  ShoppingCart, 
  MessageCircle, 
  User, 
  LogOut,
  History
} from 'lucide-react';
import { authAPI } from '@/lib/api';

const userMenuItems = [
  { name: 'Dashboard', href: '/user/dashboard', icon: Home },
  { name: 'Jelajahi Menu', href: '/user/explore', icon: ShoppingBag },
  { name: 'Keranjang', href: '/user/cart', icon: ShoppingCart },
  { name: 'Riwayat Pesanan', href: '/user/orders', icon: History },
  { name: 'Chat', href: '/user/chat', icon: MessageCircle },
  { name: 'Profil', href: '/user/profile', icon: User },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isAuthenticated = useMemo(() => {
    const token = Cookies.get('authToken');
    const role = Cookies.get('userRole');
    return !!token && role === 'USER';
  }, []);

  if (!isAuthenticated) {
    redirect('/auth');
  }

  const handleLogout = async () => {
    await authAPI.logout();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Titipin</h1>
              <p className="text-xs text-gray-500">Customer Panel</p>
            </div>
          </div>

          <nav className="space-y-1">
            {userMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}
