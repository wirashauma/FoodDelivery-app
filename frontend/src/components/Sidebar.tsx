'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bike,
  DollarSign,
  LogOut,
  Menu,
  X,
  Settings,
  Home,
  Store,
  MessageSquare,
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';

const menuItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Keluhan', href: '/complaints', icon: MessageSquare },
  { name: 'Produk', href: '/products', icon: Store },
  { name: 'Deliverer', href: '/deliverers', icon: Bike, badge: 3 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Pendapatan', href: '/earnings', icon: DollarSign },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

const secondaryMenuItems = [
  { name: 'Ke Beranda', href: '/', icon: Home },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useSidebar();

  const handleLogout = () => {
    authAPI.logout();
    router.push('/auth');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-40 transform transition-all duration-300 ease-in-out border-r border-gray-100
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64 w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 border-b border-gray-100 gap-3 px-5">
            <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-600 whitespace-nowrap">TITIPIN</h1>
              <p className="text-[10px] text-gray-400 -mt-1 whitespace-nowrap">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={closeMobileMenu}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                  )}
                  <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}>
                    <item.icon size={18} />
                  </div>
                  <span className={`font-medium text-sm whitespace-nowrap ${isActive ? 'text-primary-700' : ''}`}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Divider */}
            <div className="my-4 border-t border-gray-100" />
            
            {/* Secondary Menu */}
            {secondaryMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={closeMobileMenu}
                >
                  <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}>
                    <item.icon size={18} />
                  </div>
                  <span className={`font-medium text-sm whitespace-nowrap ${isActive ? 'text-primary-700' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors shrink-0">
                <LogOut size={18} />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
