'use client';

import { useState, useEffect } from 'react';
import { Store, Camera, MapPin, Phone, Clock, Save, X, Building, CreditCard } from 'lucide-react';
import { merchantAPI } from '@/lib/api';

interface MerchantProfile {
  id: number;
  businessName: string;
  description?: string;
  address: string;
  city?: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  bannerUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  operationalHours?: {
    open: string;
    close: string;
  };
  rating?: number;
  reviewCount?: number;
  isOpen: boolean;
  owner?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export default function MerchantProfilePage() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    openingTime: '08:00',
    closingTime: '22:00',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await merchantAPI.getProfile();
      setProfile(data);
      setFormData({
        businessName: data.businessName || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        phone: data.phone || '',
        bankName: data.bankName || '',
        bankAccountNumber: data.bankAccountNumber || '',
        bankAccountName: data.bankAccountName || '',
        openingTime: data.operationalHours?.open || '08:00',
        closingTime: data.operationalHours?.close || '22:00',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await merchantAPI.updateProfile({
        businessName: formData.businessName,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountName: formData.bankAccountName,
      });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profil Toko</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 bg-linear-to-r from-orange-500 to-red-500">
          <div className="absolute -bottom-12 left-6">
            <div className="relative w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden">
              {profile?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.imageUrl} alt={profile.businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                  <Store className="w-10 h-10 text-orange-500" />
                </div>
              )}
              {editing && (
                <button className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            {profile?.rating && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                ⭐ {profile.rating.toFixed(1)} ({profile.reviewCount || 0})
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${profile?.isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
              {profile?.isOpen ? 'Buka' : 'Tutup'}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <div className="pt-16 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              ) : (
                <p className="py-2.5 font-medium">{profile?.businessName || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              {editing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
              ) : (
                <p className="py-2.5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {profile?.phone || '-'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
              {editing ? (
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
              ) : (
                <p className="py-2.5 flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  {profile?.city || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Pemilik</label>
              <p className="py-2.5 text-gray-600">{profile?.owner?.email || '-'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                placeholder="Ceritakan tentang toko Anda..."
              />
            ) : (
              <p className="py-2.5 text-gray-600">{profile?.description || 'Belum ada deskripsi'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            {editing ? (
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                />
              </div>
            ) : (
              <p className="py-2.5 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                {profile?.address || '-'}
              </p>
            )}
          </div>

          {/* Bank Info Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              Informasi Bank
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                    placeholder="BCA, Mandiri, dll."
                  />
                ) : (
                  <p className="py-2.5">{profile?.bankName || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                ) : (
                  <p className="py-2.5">{profile?.bankAccountNumber || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                ) : (
                  <p className="py-2.5">{profile?.bankAccountName || '-'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Buka</label>
              {editing ? (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
              ) : (
                <p className="py-2.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {profile?.operationalHours?.open || '08:00'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Tutup</label>
              {editing ? (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
              ) : (
                <p className="py-2.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {profile?.operationalHours?.close || '22:00'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
