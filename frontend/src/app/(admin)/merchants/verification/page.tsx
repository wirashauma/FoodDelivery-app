'use client';

import { useState, useEffect } from 'react';
import { 
  Store, FileText, Check, X, Eye, Clock, 
  AlertCircle, CheckCircle2, XCircle, Search 
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

interface MerchantDocument {
  id: number;
  type: string;
  documentUrl: string;
  documentNumber?: string;
  status: string;
  createdAt: string;
  verifiedAt?: string;
  notes?: string;
}

interface Merchant {
  id: number;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  verificationStatus: string;
  createdAt: string;
  owner: {
    fullName?: string;
    email: string;
  };
  documents: MerchantDocument[];
}

interface DetailedMerchant extends Merchant {
  description?: string;
  cuisineTypes: string[];
  operationalHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export default function MerchantVerificationPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [selectedMerchant, setSelectedMerchant] = useState<DetailedMerchant | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, [filterStatus]);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  };

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/merchants?status=${filterStatus}&page=1&limit=50`
      );
      const merchantsData = response.data?.merchants || response.data || [];
      setMerchants(merchantsData);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (merchantId: number) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/merchants/${merchantId}`);
      setSelectedMerchant(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching merchant detail:', error);
    }
  };

  const handleVerifyMerchant = async (
    merchantId: number,
    action: 'APPROVED' | 'REJECTED',
    reason?: string
  ) => {
    setActionLoading(true);
    try {
      await fetchWithAuth(`${BASE_URL}/merchants/${merchantId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: action,
          rejectionReason: reason
        }),
      });

      alert(action === 'APPROVED' ? 'Merchant disetujui!' : 'Merchant ditolak');
      setIsDetailModalOpen(false);
      fetchMerchants();
    } catch (error) {
      console.error('Error verifying merchant:', error);
      alert('Gagal melakukan verifikasi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDocument = async (
    docId: number,
    action: 'APPROVED' | 'REJECTED',
    notes?: string
  ) => {
    setActionLoading(true);
    try {
      await fetchWithAuth(`${BASE_URL}/merchants/${selectedMerchant?.id}/documents/${docId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action, notes }),
      });

      alert(action === 'APPROVED' ? 'Dokumen disetujui' : 'Dokumen ditolak');
      
      // Refresh merchant detail
      if (selectedMerchant) {
        const response = await fetchWithAuth(`${BASE_URL}/merchants/${selectedMerchant.id}`);
        setSelectedMerchant(response.data);
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      alert('Gagal memverifikasi dokumen');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMerchants = merchants.filter((merchant) =>
    merchant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      SUSPENDED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle },
    };

    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Merchant</h1>
          <p className="text-gray-500 mt-1">Kelola pendaftaran dan dokumen merchant</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari merchant..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterStatus === status
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Merchants List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredMerchants.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada merchant</h3>
          <p className="text-gray-500">
            Tidak ada merchant dengan status {filterStatus}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMerchants.map((merchant) => (
            <div
              key={merchant.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {merchant.businessName}
                  </h3>
                  <p className="text-sm text-gray-500">{merchant.city}</p>
                </div>
                {getStatusBadge(merchant.verificationStatus)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Owner:</span>
                  <span>{merchant.owner?.fullName || merchant.owner?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Email:</span>
                  <span>{merchant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Phone:</span>
                  <span>{merchant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={16} />
                  <span>{merchant.documents?.length || 0} dokumen</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetail(merchant.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedMerchant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMerchant.businessName}
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="font-medium">Status:</span>
                {getStatusBadge(selectedMerchant.verificationStatus)}
              </div>

              {/* Business Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informasi Bisnis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nama Bisnis:</span>
                    <p className="font-medium">{selectedMerchant.businessName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kota:</span>
                    <p className="font-medium">{selectedMerchant.city}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedMerchant.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Telepon:</span>
                    <p className="font-medium">{selectedMerchant.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Alamat:</span>
                    <p className="font-medium">{selectedMerchant.address}</p>
                  </div>
                  {selectedMerchant.description && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Deskripsi:</span>
                      <p className="font-medium">{selectedMerchant.description}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-500">Jenis Masakan:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedMerchant.cuisineTypes?.map((cuisine, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Hours */}
              {selectedMerchant.operationalHours && selectedMerchant.operationalHours.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Jam Operasional</h3>
                  <div className="space-y-2">
                    {selectedMerchant.operationalHours.map((hour, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 w-24">
                          {DAYS[hour.dayOfWeek]}
                        </span>
                        {hour.isClosed ? (
                          <span className="text-red-500 font-medium">Tutup</span>
                        ) : (
                          <span className="text-gray-600">
                            {hour.openTime} - {hour.closeTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank Account */}
              {selectedMerchant.bankName && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Informasi Bank</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Bank:</span>
                      <p className="font-medium">{selectedMerchant.bankName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Nomor Rekening:</span>
                      <p className="font-medium">{selectedMerchant.bankAccountNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Nama Pemilik:</span>
                      <p className="font-medium">{selectedMerchant.bankAccountName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dokumen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMerchant.documents?.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.type}</h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: localeId })}
                          </p>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>

                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-center mb-2"
                      >
                        Lihat Dokumen
                      </a>

                      {doc.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                            disabled={actionLoading}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Alasan penolakan:');
                              if (reason) handleVerifyDocument(doc.id, 'REJECTED', reason);
                            }}
                            disabled={actionLoading}
                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Actions */}
              {selectedMerchant.verificationStatus === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleVerifyMerchant(selectedMerchant.id, 'APPROVED')}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    Setujui Merchant
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Alasan penolakan merchant:');
                      if (reason) handleVerifyMerchant(selectedMerchant.id, 'REJECTED', reason);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                  >
                    <X className="w-5 h-5 inline mr-2" />
                    Tolak Merchant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

