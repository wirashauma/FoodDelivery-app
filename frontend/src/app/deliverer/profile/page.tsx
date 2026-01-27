'use client';

import { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, Save, Edit3, Camera } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface UserProfile {
  id: number;
  nama: string;
  email: string;
  phone?: string;
  alamat?: string;
  profile_photo?: string;
  role: string;
}

export default function DelivererProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    phone: '',
    alamat: '',
  });

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data);
      setFormData({
        nama: response.data.nama || '',
        phone: response.data.phone || '',
        alamat: response.data.alamat || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(formData);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
        <p className="text-gray-500">Kelola informasi akun driver Anda</p>
      </div>

      {/* Profile Photo Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.nama?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
              <Camera size={16} className="text-gray-600" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">{profile?.nama}</h2>
          <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium mt-2">
            {profile?.role === 'DELIVERER' ? 'Driver Aktif' : profile?.role}
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">Informasi Pribadi</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <Edit3 size={18} />
              Edit
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-600 transition-colors"
            >
              Batal
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Nama */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <User size={16} />
              Nama Lengkap
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.nama}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
                {profile?.nama || '-'}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Mail size={16} />
              Email
            </label>
            <p className="px-4 py-3 bg-gray-100 rounded-xl text-gray-500">
              {profile?.email || '-'}
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Phone size={16} />
              Nomor Telepon
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Masukkan nomor telepon"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
                {profile?.phone || '-'}
              </p>
            )}
          </div>

          {/* Alamat */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <MapPin size={16} />
              Alamat
            </label>
            {editing ? (
              <textarea
                value={formData.alamat}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Masukkan alamat lengkap"
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
                {profile?.alamat || '-'}
              </p>
            )}
          </div>
        </div>

        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={18} />
                Simpan Perubahan
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats Card */}
      <div className="bg-linear-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-4">Status Akun Driver</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-red-100 text-sm">Status</p>
            <p className="text-xl font-bold">Aktif</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-red-100 text-sm">Bergabung</p>
            <p className="text-xl font-bold">2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
