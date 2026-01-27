'use client';

import { Bell, User } from 'lucide-react';
import { useMemo } from 'react';
import Cookies from 'js-cookie';

interface AdminUser {
  username: string;
  email: string;
}

export default function Header() {
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

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Page Title - can be dynamic */}
        <div className="lg:ml-0 ml-12">
          <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">{admin?.username}</p>
              <p className="text-xs text-gray-500">{admin?.email}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
