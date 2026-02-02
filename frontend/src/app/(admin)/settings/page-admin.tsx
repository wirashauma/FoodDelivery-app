'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  DollarSign,
  Percent,
  Truck,
  Bell,
  Shield,
  Save,
  RefreshCw,
} from 'lucide-react';

interface SystemSettings {
  deliveryFee: {
    baseRate: number;
    perKilometer: number;
    minimum: number;
    maximum: number;
  };
  commission: {
    merchantRate: number;
    delivererRate: number;
    platformFee: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeout: number;
    passwordMinLength: number;
  };
  operational: {
    maxDeliveryRadius: number;
    operatingHoursStart: string;
    operatingHoursEnd: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    deliveryFee: {
      baseRate: 5000,
      perKilometer: 2000,
      minimum: 5000,
      maximum: 50000,
    },
    commission: {
      merchantRate: 15,
      delivererRate: 80,
      platformFee: 1000,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
    },
    security: {
      maxLoginAttempts: 5,
      sessionTimeout: 3600,
      passwordMinLength: 8,
    },
    operational: {
      maxDeliveryRadius: 10,
      operatingHoursStart: '06:00',
      operatingHoursEnd: '22:00',
    },
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to save settings
      // await adminSettingsAPI.update(settings);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Pengaturan berhasil disimpan');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset semua pengaturan ke default?')) {
      setSettings({
        deliveryFee: {
          baseRate: 5000,
          perKilometer: 2000,
          minimum: 5000,
          maximum: 50000,
        },
        commission: {
          merchantRate: 15,
          delivererRate: 80,
          platformFee: 1000,
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        security: {
          maxLoginAttempts: 5,
          sessionTimeout: 3600,
          passwordMinLength: 8,
        },
        operational: {
          maxDeliveryRadius: 10,
          operatingHoursStart: '06:00',
          operatingHoursEnd: '22:00',
        },
      });
      setHasChanges(true);
      toast.info('Pengaturan direset ke default');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Kelola pengaturan platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Ada perubahan yang belum disimpan. Klik "Simpan Perubahan" untuk menyimpan.
          </p>
        </div>
      )}

      {/* Delivery Fee Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delivery Fee Configuration</h2>
              <p className="text-sm text-gray-600">Atur biaya pengiriman</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Rate (Rp)
            </label>
            <input
              type="number"
              value={settings.deliveryFee.baseRate}
              onChange={(e) => handleChange('deliveryFee', 'baseRate', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Kilometer (Rp)
            </label>
            <input
              type="number"
              value={settings.deliveryFee.perKilometer}
              onChange={(e) => handleChange('deliveryFee', 'perKilometer', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Fee (Rp)
            </label>
            <input
              type="number"
              value={settings.deliveryFee.minimum}
              onChange={(e) => handleChange('deliveryFee', 'minimum', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Fee (Rp)
            </label>
            <input
              type="number"
              value={settings.deliveryFee.maximum}
              onChange={(e) => handleChange('deliveryFee', 'maximum', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Percent className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Commission & Fees</h2>
              <p className="text-sm text-gray-600">Atur komisi dan biaya platform</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Commission (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.commission.merchantRate}
              onChange={(e) => handleChange('commission', 'merchantRate', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Komisi dari total order</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Share (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.commission.delivererRate}
              onChange={(e) => handleChange('commission', 'delivererRate', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Bagian driver dari delivery fee</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Fee (Rp)
            </label>
            <input
              type="number"
              value={settings.commission.platformFee}
              onChange={(e) => handleChange('commission', 'platformFee', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Biaya platform per order</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">Kelola notifikasi sistem</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Email Notifications</span>
              <p className="text-sm text-gray-600">Kirim notifikasi via email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailEnabled}
              onChange={(e) => handleChange('notifications', 'emailEnabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">SMS Notifications</span>
              <p className="text-sm text-gray-600">Kirim notifikasi via SMS</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.smsEnabled}
              onChange={(e) => handleChange('notifications', 'smsEnabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Push Notifications</span>
              <p className="text-sm text-gray-600">Kirim push notification ke apps</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.pushEnabled}
              onChange={(e) => handleChange('notifications', 'pushEnabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-600">Pengaturan keamanan sistem</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => handleChange('security', 'maxLoginAttempts', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (seconds)
            </label>
            <input
              type="number"
              min="300"
              max="86400"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleChange('security', 'sessionTimeout', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Password Length
            </label>
            <input
              type="number"
              min="6"
              max="20"
              value={settings.security.passwordMinLength}
              onChange={(e) => handleChange('security', 'passwordMinLength', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Operational Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Operational</h2>
              <p className="text-sm text-gray-600">Pengaturan operasional</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Delivery Radius (km)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.operational.maxDeliveryRadius}
              onChange={(e) => handleChange('operational', 'maxDeliveryRadius', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating Hours Start
            </label>
            <input
              type="time"
              value={settings.operational.operatingHoursStart}
              onChange={(e) => handleChange('operational', 'operatingHoursStart', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating Hours End
            </label>
            <input
              type="time"
              value={settings.operational.operatingHoursEnd}
              onChange={(e) => handleChange('operational', 'operatingHoursEnd', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
