'use client';

import { Bell, User, Settings, Search, Package, UserPlus, CreditCard, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { notificationsAPI } from '@/lib/api';

interface AdminUser {
  username: string;
  email: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  time: string;
  unread: boolean;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = 'Dashboard', subtitle }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const admin = useMemo<AdminUser | null>(() => {
    const token = Cookies.get('adminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          username: payload.username || 'Admin',
          email: payload.email || '',
        };
      } catch {
        return { username: 'Admin', email: '' };
      }
    }
    return null;
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationsAPI.getAll(5);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={16} className="text-blue-500" />;
      case 'deliverer':
        return <UserPlus size={16} className="text-green-500" />;
      case 'payment':
        return <CreditCard size={16} className="text-purple-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4">
        {/* Page Title */}
        <div className="lg:ml-0 ml-12">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Cari..."
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-40"
            />
          </div>

          {/* Settings */}
          <button 
            onClick={() => router.push('/settings')}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Settings size={20} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4.5 h-4.5 px-1 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-4 py-8 text-center text-gray-400">
                      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm">Memuat...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${notif.unread ? 'bg-primary-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 font-medium">{notif.title}</p>
                            {notif.message && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                          {notif.unread && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      router.push('/orders');
                    }}
                    className="text-sm text-primary-600 font-medium hover:text-primary-700"
                  >
                    Lihat semua
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-1" />

          {/* User info */}
          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-700">{admin?.username}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-linear-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <User size={20} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
