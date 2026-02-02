'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Store, Camera, MapPin, Phone, Clock, Save, X, Building, 
  CreditCard, CheckCircle, AlertCircle 
} from 'lucide-react';
import { merchantAPI } from '@/lib/api';
import Image from 'next/image';

interface MerchantProfile {
  id: number;
  businessName: string;
  description?: string;
  address: string;
  city?: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  verificationStatus?: string;
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/merchants/me/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, logoUrl: data.data.logoUrl } : null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Gagal upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/merchants/me/banner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, bannerUrl: data.data.bannerUrl } : null);
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Gagal upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const getVerificationBadge = (status?: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ComponentType<{ size?: number }> }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
      SUSPENDED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: X },
    };

    const badge = badges[status || 'PENDING'];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={16} />
        {status || 'PENDING'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Toko</h1>
          <p className="text-gray-500 mt-1">Kelola informasi bisnis Anda</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Edit Profil
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner Section */}
        <div className="relative h-56 bg-linear-to-r from-red-500 to-red-600">
          {profile?.bannerUrl && (
            <Image 
              src={profile.bannerUrl} 
              alt="Banner" 
              fill
              className="object-cover"
            />
          )}
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="absolute top-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {uploadingBanner ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Ganti Banner
              </>
            )}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />

          {/* Logo */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative w-32 h-32 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden group">
              {profile?.logoUrl ? (
                <Image src={profile.logoUrl} alt="Logo" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-red-100 flex items-center justify-center">
                  <Store className="w-12 h-12 text-red-500" />
                </div>
              )}
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploadingLogo ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {profile?.verificationStatus && (
              <div className="bg-white/90 px-3 py-1.5 rounded-lg">
                {getVerificationBadge(profile.verificationStatus)}
              </div>
            )}
            <span className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
              profile?.isOpen 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-500 text-white'
            }`}>
              {profile?.isOpen ? '🟢 Buka' : '⚫ Tutup'}
            </span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-20 p-8 space-y-8">
          {/* Business Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-red-500" />
              Informasi Bisnis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                ) : (
                  <p className="py-2.5 font-medium">{profile?.businessName || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Pemilik</label>
                <p className="py-2.5 text-gray-600">{profile?.owner?.email || '-'}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Bisnis</label>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none resize-none"
                  rows={4}
                  placeholder="Ceritakan tentang toko Anda..."
                />
              ) : (
                <p className="py-2.5 text-gray-700">{profile?.description || 'Tidak ada deskripsi'}</p>
              )}
            </div>
          </div>

          {/* Contact & Location Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Kontak & Lokasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                {editing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                ) : (
                  <p className="py-2.5 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {profile?.phone || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                {editing ? (
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                ) : (
                  <p className="py-2.5 flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    {profile?.city || '-'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              {editing ? (
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none resize-none"
                  />
                </div>
              ) : (
                <p className="py-2.5 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  {profile?.address || '-'}
                </p>
              )}
            </div>
          </div>

          {/* Bank Info Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                ) : (
                  <p className="py-2.5">{profile?.bankAccountName || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Operational Hours */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              Jam Operasional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Buka</label>
              {editing ? (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
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
    </div>
  );
}
