'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import {
  Eye,
  Check,
  X,
  Clock,
  FileText,
  User,
  Camera,
  Car,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  IdCard,
  FileCheck,
} from 'lucide-react';

// Types
interface DriverDocument {
  id: number;
  type: 'KTP' | 'SIM' | 'NPWP' | 'STNK' | 'FACE';
  documentNumber: string | null;
  documentUrl: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  expiryDate: string | null;
  extractedData?: Record<string, string>;
  notes?: string;
  createdAt: string;
  verifiedAt: string | null;
}

interface DelivererVerification {
  id: number;
  userId: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    profilePicture: string | null;
    registeredAt: string;
  };
  vehicle: {
    type: string;
    brand: string | null;
    model: string | null;
    plateNumber: string | null;
    year: number | null;
    color: string | null;
  };
  verificationStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isVerified: boolean;
  documents: DriverDocument[];
  createdAt: string;
  updatedAt: string;
}

interface VerificationStats {
  profiles: {
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    suspended: number;
    total: number;
  };
  pendingDocuments: Record<string, number>;
  recentVerifications: number;
}

// API helper
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Stats Card
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'yellow' | 'blue' | 'green' | 'red' | 'gray';
}) {
  const colors = {
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    UNDER_REVIEW: 'Ditinjau',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    SUSPENDED: 'Ditangguhkan',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

// Document Type Icon
function DocumentIcon({ type }: { type: string }) {
  switch (type) {
    case 'KTP':
      return <IdCard size={18} className="text-blue-500" />;
    case 'SIM':
      return <CreditCard size={18} className="text-green-500" />;
    case 'NPWP':
      return <FileCheck size={18} className="text-purple-500" />;
    case 'STNK':
      return <Car size={18} className="text-orange-500" />;
    case 'FACE':
      return <Camera size={18} className="text-pink-500" />;
    default:
      return <FileText size={18} className="text-gray-500" />;
  }
}

// Document Card
function DocumentCard({
  doc,
  onVerify,
  loading,
}: {
  doc: DriverDocument;
  onVerify: (id: number, action: 'APPROVED' | 'REJECTED', notes?: string) => void;
  loading: boolean;
}) {
  const [showImage, setShowImage] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const docLabels: Record<string, string> = {
    KTP: 'KTP (Kartu Tanda Penduduk)',
    SIM: 'SIM (Surat Izin Mengemudi)',
    NPWP: 'NPWP',
    STNK: 'STNK Kendaraan',
    FACE: 'Foto Wajah (Verifikasi)',
  };

  return (
    <>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <DocumentIcon type={doc.type} />
            <div>
              <p className="font-medium text-gray-800">{docLabels[doc.type] || doc.type}</p>
              {doc.documentNumber && (
                <p className="text-xs text-gray-500">No: {doc.documentNumber}</p>
              )}
            </div>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        {/* Document Preview */}
        <div
          className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-3 cursor-pointer"
          onClick={() => setShowImage(true)}
        >
          {doc.documentUrl ? (
            <img
              src={doc.documentUrl}
              alt={doc.type}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <FileText size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
            <Eye size={24} className="text-white opacity-0 hover:opacity-100" />
          </div>
        </div>

        {/* Extracted Data */}
        {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
          <div className="mb-3 p-2 bg-white rounded border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Data OCR:</p>
            <div className="space-y-1">
              {Object.entries(doc.extractedData).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-500">{key}:</span>
                  <span className="text-gray-700 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-400 mb-3">
          <p>Diupload: {format(new Date(doc.createdAt), 'dd MMM yyyy HH:mm', { locale: localeId })}</p>
          {doc.verifiedAt && (
            <p>Diverifikasi: {format(new Date(doc.verifiedAt), 'dd MMM yyyy HH:mm', { locale: localeId })}</p>
          )}
        </div>

        {/* Actions */}
        {doc.status === 'PENDING' && (
          <div className="flex gap-2">
            <button
              onClick={() => onVerify(doc.id, 'APPROVED')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
            >
              <Check size={16} />
              Setujui
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
            >
              <X size={16} />
              Tolak
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {showImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={doc.documentUrl}
              alt={doc.type}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImage(false)}
              className="absolute top-2 right-2 p-2 bg-white/20 rounded-full hover:bg-white/40"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Alasan Penolakan">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Berikan alasan mengapa dokumen {docLabels[doc.type]} ditolak:
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Contoh: Foto tidak jelas, data tidak sesuai, dokumen kadaluarsa..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onVerify(doc.id, 'REJECTED', rejectReason);
                setShowRejectModal(false);
                setRejectReason('');
              }}
              disabled={!rejectReason.trim() || loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Tolak Dokumen
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<DelivererVerification[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<DelivererVerification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/admin/verification/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/admin/verification/pending?page=${page}&limit=10&status=${statusFilter}`
      );
      setVerifications(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Gagal memuat data verifikasi');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    fetchVerifications();
  }, [fetchStats, fetchVerifications]);

  // View detail
  const handleViewDetail = async (profile: DelivererVerification) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/admin/verification/${profile.id}`);
      setSelectedProfile(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching detail:', error);
      toast.error('Gagal memuat detail');
    }
  };

  // Verify document
  const handleVerifyDocument = async (docId: number, action: 'APPROVED' | 'REJECTED', notes?: string) => {
    setActionLoading(true);
    try {
      await fetchWithAuth(`${BASE_URL}/admin/documents/${docId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ action, notes }),
      });
      toast.success(action === 'APPROVED' ? 'Dokumen disetujui' : 'Dokumen ditolak');
      
      // Refresh data
      if (selectedProfile) {
        const response = await fetchWithAuth(`${BASE_URL}/admin/verification/${selectedProfile.id}`);
        setSelectedProfile(response.data);
      }
      fetchVerifications();
      fetchStats();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Gagal memverifikasi dokumen');
    } finally {
      setActionLoading(false);
    }
  };

  // Activate/Reject deliverer account
  const handleActivateDeliverer = async (profileId: number, action: 'APPROVED' | 'REJECTED', reason?: string) => {
    setActionLoading(true);
    try {
      await fetchWithAuth(`${BASE_URL}/admin/verification/${profileId}/activate`, {
        method: 'PUT',
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      toast.success(
        action === 'APPROVED' ? 'Akun deliverer berhasil diaktifkan' : 'Akun deliverer ditolak'
      );
      
      setIsDetailModalOpen(false);
      setSelectedProfile(null);
      fetchVerifications();
      fetchStats();
    } catch (error: any) {
      console.error('Error activating deliverer:', error);
      toast.error(error.message || 'Gagal mengaktifkan akun');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter by search
  const filteredVerifications = verifications.filter((v) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.user.fullName?.toLowerCase().includes(query) ||
      v.user.email?.toLowerCase().includes(query) ||
      v.user.phone?.includes(query)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Verifikasi Deliverer</h1>
        <p className="text-gray-500">Kelola dan verifikasi dokumen pendaftaran deliverer</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatsCard
            title="Menunggu"
            value={stats.profiles.pending}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Ditinjau"
            value={stats.profiles.underReview}
            icon={Eye}
            color="blue"
          />
          <StatsCard
            title="Disetujui"
            value={stats.profiles.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Ditolak"
            value={stats.profiles.rejected}
            icon={XCircle}
            color="red"
          />
          <StatsCard
            title="Total"
            value={stats.profiles.total}
            icon={User}
            color="gray"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="PENDING">Menunggu Verifikasi</option>
              <option value="UNDER_REVIEW">Sedang Ditinjau</option>
              <option value="APPROVED">Sudah Disetujui</option>
              <option value="REJECTED">Ditolak</option>
              <option value="SUSPENDED">Ditangguhkan</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => {
              fetchVerifications();
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data verifikasi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deliverer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kendaraan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dokumen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Daftar</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVerifications.map((v) => {
                  const approvedDocs = v.documents.filter((d) => d.status === 'APPROVED').length;
                  const totalDocs = v.documents.length;
                  const requiredDocs = ['KTP', 'SIM', 'FACE'];
                  const hasRequired = requiredDocs.every((type) =>
                    v.documents.some((d) => d.type === type)
                  );

                  return (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            {v.user.profilePicture ? (
                              <img
                                src={v.user.profilePicture}
                                alt={v.user.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <User size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{v.user.fullName || '-'}</p>
                            <p className="text-xs text-gray-500">{v.user.email}</p>
                            <p className="text-xs text-gray-400">{v.user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-800">{v.vehicle.type || '-'}</p>
                            <p className="text-xs text-gray-500">{v.vehicle.plateNumber || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {v.documents.slice(0, 3).map((doc) => (
                              <div
                                key={doc.id}
                                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                                  doc.status === 'APPROVED'
                                    ? 'bg-green-100'
                                    : doc.status === 'REJECTED'
                                    ? 'bg-red-100'
                                    : 'bg-yellow-100'
                                }`}
                              >
                                <DocumentIcon type={doc.type} />
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {approvedDocs}/{totalDocs}
                            {!hasRequired && (
                              <span className="text-red-500 ml-1">(belum lengkap)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={v.verificationStatus} />
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-500">
                          {format(new Date(v.createdAt), 'dd MMM yyyy', { locale: localeId })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleViewDetail(v)}
                            className="flex items-center gap-1 px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm"
                          >
                            <Eye size={16} />
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProfile(null);
        }}
        title="Detail Verifikasi Deliverer"
        size="xl"
      >
        {selectedProfile && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {selectedProfile.user.profilePicture ? (
                  <img
                    src={selectedProfile.user.profilePicture}
                    alt={selectedProfile.user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedProfile.user.fullName || 'Nama belum diisi'}
                </h3>
                <p className="text-sm text-gray-500">{selectedProfile.user.email}</p>
                <p className="text-sm text-gray-500">{selectedProfile.user.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={selectedProfile.verificationStatus} />
                  {selectedProfile.isVerified && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Terverifikasi
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Car size={18} className="text-blue-500" />
                <h4 className="font-medium text-gray-800">Informasi Kendaraan</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Jenis</p>
                  <p className="font-medium">{selectedProfile.vehicle.type || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Merk</p>
                  <p className="font-medium">{selectedProfile.vehicle.brand || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Model</p>
                  <p className="font-medium">{selectedProfile.vehicle.model || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Plat Nomor</p>
                  <p className="font-medium">{selectedProfile.vehicle.plateNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tahun</p>
                  <p className="font-medium">{selectedProfile.vehicle.year || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Warna</p>
                  <p className="font-medium">{selectedProfile.vehicle.color || '-'}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={18} />
                Dokumen ({selectedProfile.documents.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProfile.documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onVerify={handleVerifyDocument}
                    loading={actionLoading}
                  />
                ))}
              </div>
              {selectedProfile.documents.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Belum ada dokumen yang diupload</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedProfile.verificationStatus !== 'APPROVED' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleActivateDeliverer(selectedProfile.id, 'APPROVED')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={20} />
                  Aktifkan Akun Deliverer
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Alasan penolakan akun:');
                    if (reason) {
                      handleActivateDeliverer(selectedProfile.id, 'REJECTED', reason);
                    }
                  }}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircle size={20} />
                  Tolak Pendaftaran
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
