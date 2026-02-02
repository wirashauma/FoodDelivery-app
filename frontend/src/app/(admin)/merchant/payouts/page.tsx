'use client';

import { useState, useEffect } from 'react';
import { Wallet, DollarSign, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ArrowUpRight } from 'lucide-react';
import { payoutAPI } from '@/lib/api';

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

export default function MerchantPayouts() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [formData, setFormData] = useState({
    amount: 0,
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await payoutAPI.getAll();
      const data = Array.isArray(res) ? res : (res?.data || []);
      setPayouts(data);
      
      // Calculate pending balance (simulated)
      const completedPayouts = data.filter((p: PayoutRequest) => p.status === 'COMPLETED')
        .reduce((sum: number, p: PayoutRequest) => sum + p.amount, 0);
      setPendingBalance(5000000 - completedPayouts); // Simulated balance
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await payoutAPI.request(formData);
      setShowModal(false);
      setFormData({ amount: 0, bankName: '', accountNumber: '', accountName: '' });
      fetchPayouts();
    } catch (error) {
      console.error('Error submitting payout request:', error);
      alert('Gagal mengajukan permintaan pencairan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PROCESSING: { label: 'Diproses', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return configs[status] || configs.PENDING;
  };

  // Stats
  const stats = {
    totalPending: payouts.filter(p => ['PENDING', 'PROCESSING'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0),
    totalCompleted: payouts.filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0),
    pendingCount: payouts.filter(p => ['PENDING', 'PROCESSING'].includes(p.status)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-orange-100 text-sm">Saldo Tersedia</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(pendingBalance)}</p>
            <p className="text-orange-200 text-sm mt-2">Dapat dicairkan kapan saja</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Cairkan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dalam Proses</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalPending)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">{stats.pendingCount} permintaan</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Dicairkan</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalCompleted)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">Sepanjang waktu</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Permintaan</p>
              <p className="text-xl font-bold">{payouts.length}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">Riwayat pencairan</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Riwayat Pencairan</h2>
          <button
            onClick={fetchPayouts}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {payouts.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Belum ada riwayat pencairan</p>
            </div>
          ) : (
            payouts.map(payout => {
              const statusConfig = getStatusConfig(payout.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={payout.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{formatCurrency(payout.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(payout.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {payout.bankName && (
                    <div className="ml-11 text-sm text-gray-500">
                      <p>{payout.bankName} • {payout.accountNumber}</p>
                      <p>{payout.accountName}</p>
                    </div>
                  )}
                  
                  {payout.notes && payout.status === 'REJECTED' && (
                    <div className="ml-11 mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                      Alasan: {payout.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Request Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Ajukan Pencairan</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <p className="text-sm text-orange-600">Saldo Tersedia</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(pendingBalance)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pencairan</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  required
                  min={10000}
                  max={pendingBalance}
                  placeholder="Min. Rp 10.000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  required
                >
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Permata</option>
                  <option value="Dana">Dana</option>
                  <option value="OVO">OVO</option>
                  <option value="GoPay">GoPay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  required
                  placeholder="Masukkan nomor rekening"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                  required
                  placeholder="Nama sesuai rekening"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.amount > pendingBalance}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Ajukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
