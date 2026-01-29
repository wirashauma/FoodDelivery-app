'use client';

import { useState, useMemo, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { authAPI } from '@/lib/api';

interface AdminUser {
  username: string;
  email: string;
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'security', label: 'Keamanan', icon: Lock },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'appearance', label: 'Tampilan', icon: Palette },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    phone: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailOrders: true,
    emailDeliverers: true,
    pushOrders: true,
    pushDeliverers: false,
    soundEnabled: true,
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    language: 'id',
    compactMode: false,
  });

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

  // Initialize profile form from admin data
  useEffect(() => {
    if (admin && !profileForm.username && !profileForm.email) {
      setProfileForm(prev => ({
        ...prev,
        username: admin.username || '',
        email: admin.email || '',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile({
        username: profileForm.username,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      toast.success('Profil berhasil disimpan');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru tidak cocok');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password berhasil diubah');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Notification settings are stored locally for now
      // In future, this could be synced with backend
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      toast.success('Pengaturan notifikasi berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    setSaving(true);
    try {
      // Appearance settings are stored locally
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      toast.success('Pengaturan tampilan berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  // Load saved settings from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch {
        // Ignore parse errors
      }
    }
    const savedAppearance = localStorage.getItem('appearanceSettings');
    if (savedAppearance) {
      try {
        setAppearanceSettings(JSON.parse(savedAppearance));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const renderProfileSection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Informasi Profil</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Perbarui informasi profil Anda di sini.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-linear-to-br from-primary-400 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
          <span className="text-white text-xl sm:text-2xl font-bold">
            {admin?.username?.charAt(0).toUpperCase() || 'A'}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{admin?.username}</h4>
          <p className="text-xs sm:text-sm text-gray-500">Administrator</p>
          <button className="mt-1 sm:mt-2 text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ubah foto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Username</label>
          <input
            type="text"
            value={profileForm.username}
            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email</label>
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nomor Telepon</label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            placeholder="+62..."
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="pt-3 sm:pt-4">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm bg-primary-600 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} className="sm:w-4.5 sm:h-4.5" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Keamanan Akun</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Kelola password dan keamanan akun Anda.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <Shield size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-yellow-800">Tips Keamanan</p>
            <p className="text-xs sm:text-sm text-yellow-700">
              Gunakan password yang kuat dengan kombinasi huruf besar, kecil, angka, dan simbol.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Password Saat Ini</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 pr-10 sm:pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Password Baru</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 pr-10 sm:pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Konfirmasi Password Baru</label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="pt-3 sm:pt-4">
        <button
          onClick={handleChangePassword}
          disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm bg-primary-600 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Lock size={16} className="sm:w-4.5 sm:h-4.5" />
          {saving ? 'Menyimpan...' : 'Ubah Password'}
        </button>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Pengaturan Notifikasi</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Atur bagaimana Anda menerima notifikasi.</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="border-b border-gray-100 pb-3 sm:pb-4">
          <h4 className="font-medium text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Notifikasi Email</h4>
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs sm:text-sm text-gray-600">Pesanan baru</span>
              <input
                type="checkbox"
                checked={notificationSettings.emailOrders}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOrders: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs sm:text-sm text-gray-600">Pendaftaran deliverer baru</span>
              <input
                type="checkbox"
                checked={notificationSettings.emailDeliverers}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailDeliverers: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="border-b border-gray-100 pb-3 sm:pb-4">
          <h4 className="font-medium text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Notifikasi Push</h4>
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs sm:text-sm text-gray-600">Pesanan baru</span>
              <input
                type="checkbox"
                checked={notificationSettings.pushOrders}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, pushOrders: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs sm:text-sm text-gray-600">Pendaftaran deliverer baru</span>
              <input
                type="checkbox"
                checked={notificationSettings.pushDeliverers}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, pushDeliverers: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Suara</h4>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs sm:text-sm text-gray-600">Aktifkan suara notifikasi</span>
            <input
              type="checkbox"
              checked={notificationSettings.soundEnabled}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, soundEnabled: e.target.checked })}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      <div className="pt-3 sm:pt-4">
        <button
          onClick={handleSaveNotifications}
          disabled={saving}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm bg-primary-600 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} className="sm:w-4.5 sm:h-4.5" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Pengaturan Tampilan</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Kustomisasi tampilan dashboard.</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Tema</label>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {[
              { value: 'light', label: 'Terang' },
              { value: 'dark', label: 'Gelap' },
              { value: 'system', label: 'Sistem' },
            ].map((theme) => (
              <button
                key={theme.value}
                onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: theme.value })}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg sm:rounded-xl transition-all ${
                  appearanceSettings.theme === theme.value
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {appearanceSettings.theme === theme.value && <Check size={14} />}
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Bahasa</label>
          <select
            value={appearanceSettings.language}
            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
            className="w-full sm:max-w-xs px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="flex items-center justify-between cursor-pointer sm:max-w-md">
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Mode Kompak</span>
              <p className="text-xs text-gray-500">Menampilkan lebih banyak konten dengan spacing yang lebih kecil</p>
            </div>
            <input
              type="checkbox"
              checked={appearanceSettings.compactMode}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, compactMode: e.target.checked })}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ml-3 shrink-0"
            />
          </label>
        </div>
      </div>

      <div className="pt-3 sm:pt-4">
        <button
          onClick={handleSaveAppearance}
          disabled={saving}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm bg-primary-600 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} className="sm:w-4.5 sm:h-4.5" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'security':
        return renderSecuritySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'appearance':
        return renderAppearanceSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-6 sm:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola preferensi dan pengaturan akun Anda</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sidebar - Horizontal on mobile, Vertical on desktop */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-1.5 sm:p-2">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all text-left whitespace-nowrap lg:whitespace-normal lg:w-full ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
