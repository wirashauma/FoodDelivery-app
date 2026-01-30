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
  Building2,
  ClipboardList,
  Wallet,
  BadgePercent,
  Database,
  TrendingUp,
  ShoppingBag,
  Truck,
  ChevronDown,
  ChevronRight,
  Image,
  Ticket,
  MapPin,
  UtensilsCrossed,
  Tag,
  Cog,
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState } from 'react';

// Menu Groups for professional admin panel
interface MenuItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: number;
  children?: MenuItem[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { 
        name: 'OMS', 
        icon: ClipboardList,
        children: [
          { name: 'Live Monitor', href: '/oms', icon: TrendingUp },
          { name: 'Semua Pesanan', href: '/orders', icon: ShoppingBag },
        ]
      },
      { 
        name: 'Merchant', 
        icon: Building2,
        children: [
          { name: 'Daftar Merchant', href: '/merchants', icon: Store },
          { name: 'Verifikasi', href: '/merchants/verification', icon: ClipboardList },
        ]
      },
      { 
        name: 'Driver', 
        icon: Truck,
        children: [
          { name: 'Daftar Driver', href: '/deliverers', icon: Bike },
          { name: 'Verifikasi', href: '/deliverers/verification', icon: ClipboardList },
        ]
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { 
        name: 'Promo & Banner', 
        icon: BadgePercent,
        children: [
          { name: 'Banner', href: '/promos/banners', icon: Image },
          { name: 'Promo', href: '/promos', icon: BadgePercent },
          { name: 'Voucher', href: '/promos/vouchers', icon: Ticket },
        ]
      },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { 
        name: 'Financial', 
        icon: Wallet,
        children: [
          { name: 'Overview', href: '/financial', icon: TrendingUp },
          { name: 'Payout Merchant', href: '/financial/merchant-payouts', icon: Building2 },
          { name: 'Payout Driver', href: '/financial/driver-payouts', icon: Truck },
          { name: 'Refund', href: '/financial/refunds', icon: DollarSign },
        ]
      },
      { name: 'Pendapatan', href: '/earnings', icon: DollarSign },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { 
        name: 'Data Master', 
        icon: Database,
        children: [
          { name: 'Kategori', href: '/master-data/categories', icon: Tag },
          { name: 'Jenis Masakan', href: '/master-data/cuisine-types', icon: UtensilsCrossed },
          { name: 'Zona Pengiriman', href: '/master-data/delivery-zones', icon: MapPin },
          { name: 'Pengaturan Sistem', href: '/master-data/settings', icon: Cog },
        ]
      },
    ],
  },
  {
    title: 'Pengguna',
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Keluhan', href: '/complaints', icon: MessageSquare, badge: 3 },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { name: 'Pengaturan', href: '/settings', icon: Settings },
    ],
  },
];

const secondaryMenuItems = [
  { name: 'Ke Beranda', href: '/', icon: Home },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const handleLogout = () => {
    authAPI.logout();
    router.push('/auth');
  };

  const toggleSubmenu = (name: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + '/');
    }
    if (item.children) {
      return item.children.some(child => child.href && (pathname === child.href || pathname.startsWith(child.href + '/')));
    }
    return false;
  };

  // Auto-expand menus that have active children
  const isMenuExpanded = (item: MenuItem): boolean => {
    if (!item.children) return false;
    // Check if manually toggled
    if (expandedMenus[item.name] !== undefined) {
      return expandedMenus[item.name];
    }
    // Auto-expand if has active child
    return item.children.some(child => child.href && (pathname === child.href || pathname.startsWith(child.href + '/')));
  };

  const renderMenuItem = (item: MenuItem, isChild: boolean = false) => {
    const isActive = isMenuActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            type="button"
            onClick={(e) => toggleSubmenu(item.name, e)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full
              ${isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <div className={`p-2 rounded-lg transition-colors shrink-0 ${
              isActive 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
            }`}>
              <item.icon size={18} />
            </div>
            <span className={`font-medium text-sm whitespace-nowrap flex-1 text-left ${isActive ? 'text-primary-700' : ''}`}>
              {item.name}
            </span>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div 
            className={`ml-4 mt-1 space-y-1 overflow-hidden transition-all duration-200 ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {item.children!.map(child => renderMenuItem(child, true))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.href || item.name}
        href={item.href!}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
          ${isChild ? 'ml-2' : ''}
          ${isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        onClick={(e) => {
          e.stopPropagation();
          closeMobileMenu();
        }}
      >
        {isActive && !isChild && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
        )}
        <div className={`p-2 rounded-lg transition-colors shrink-0 ${
          isActive 
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
        }`}>
          <item.icon size={isChild ? 14 : 18} />
        </div>
        <span className={`font-medium whitespace-nowrap ${isChild ? 'text-xs' : 'text-sm'} ${isActive ? 'text-primary-700' : ''}`}>
          {item.name}
        </span>
        {item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
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
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {menuGroups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? 'mt-4' : ''}>
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map(item => renderMenuItem(item))}
                </div>
              </div>
            ))}
            
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
