'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface Profile {
  user_id: number;
  email: string;
  nama?: string;
  tgl_lahir?: string;
  no_hp?: string;
  alamat?: string;
  foto_profil?: string;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    tgl_lahir: '',
    no_hp: '',
    alamat: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authAPI.getProfile();
        setProfile(data);
        setFormData({
          nama: data.nama || '',
          tgl_lahir: data.tgl_lahir ? data.tgl_lahir.split('T')[0] : '',
          no_hp: data.no_hp || '',
          alamat: data.alamat || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await authAPI.updateProfile(formData);
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Gagal memperbarui profil' });
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
      <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>

      {message.text && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="bg-linear-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              {profile?.foto_profil ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.foto_profil} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={40} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.nama || 'User'}</h2>
              <p className="text-red-100">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} />
              Nama Lengkap
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile?.nama || '-'}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Email
            </label>
            <p className="px-4 py-3 bg-gray-100 rounded-xl text-gray-500">{profile?.email}</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} />
              Tanggal Lahir
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.tgl_lahir}
                onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
                {profile?.tgl_lahir ? new Date(profile.tgl_lahir).toLocaleDateString('id-ID') : '-'}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} />
              No. HP
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile?.no_hp || '-'}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} />
              Alamat
            </label>
            {isEditing ? (
              <textarea
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile?.alamat || '-'}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Edit Profil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
