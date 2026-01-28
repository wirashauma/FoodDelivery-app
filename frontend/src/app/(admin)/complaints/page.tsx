'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import {
  MessageSquare,
  User,
  Bike,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Send,
  Eye,
} from 'lucide-react';

// Types
interface Complaint {
  id: number;
  type: 'USER' | 'DELIVERER';
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: number;
    name: string;
    email: string;
  };
  responses: {
    id: number;
    message: string;
    createdAt: string;
    adminName: string;
  }[];
}

// Mock data
const mockComplaints: Complaint[] = [
  {
    id: 1,
    type: 'USER',
    subject: 'Pesanan tidak sampai',
    message: 'Saya sudah menunggu 2 jam tapi pesanan belum sampai. Driver tidak bisa dihubungi.',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: '2026-01-28T10:30:00Z',
    updatedAt: '2026-01-28T10:30:00Z',
    reporter: { id: 1, name: 'John Doe', email: 'john@example.com' },
    responses: [],
  },
  {
    id: 2,
    type: 'DELIVERER',
    subject: 'Customer tidak ada di tempat',
    message: 'Saya sudah sampai di lokasi tapi customer tidak ada dan tidak mengangkat telepon.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: '2026-01-27T14:20:00Z',
    updatedAt: '2026-01-28T09:00:00Z',
    reporter: { id: 2, name: 'Ahmad Driver', email: 'ahmad@example.com' },
    responses: [
      { id: 1, message: 'Kami sedang menghubungi customer.', createdAt: '2026-01-28T09:00:00Z', adminName: 'Admin' },
    ],
  },
  {
    id: 3,
    type: 'USER',
    subject: 'Makanan rusak saat diterima',
    message: 'Pesanan saya tumpah dan tidak bisa dimakan. Mohon refund.',
    status: 'RESOLVED',
    priority: 'HIGH',
    createdAt: '2026-01-26T18:45:00Z',
    updatedAt: '2026-01-27T11:30:00Z',
    reporter: { id: 3, name: 'Sarah User', email: 'sarah@example.com' },
    responses: [
      { id: 1, message: 'Mohon maaf atas ketidaknyamanannya. Kami akan memproses refund.', createdAt: '2026-01-27T10:00:00Z', adminName: 'Admin' },
      { id: 2, message: 'Refund sudah diproses ke akun Anda.', createdAt: '2026-01-27T11:30:00Z', adminName: 'Admin' },
    ],
  },
  {
    id: 4,
    type: 'DELIVERER',
    subject: 'Pembayaran belum masuk',
    message: 'Saldo penghasilan saya belum masuk ke rekening sudah 3 hari.',
    status: 'PENDING',
    priority: 'MEDIUM',
    createdAt: '2026-01-28T08:00:00Z',
    updatedAt: '2026-01-28T08:00:00Z',
    reporter: { id: 4, name: 'Budi Kurir', email: 'budi@example.com' },
    responses: [],
  },
  {
    id: 5,
    type: 'USER',
    subject: 'Driver kasar',
    message: 'Driver berbicara kasar saat mengantarkan pesanan.',
    status: 'REJECTED',
    priority: 'LOW',
    createdAt: '2026-01-25T12:00:00Z',
    updatedAt: '2026-01-26T14:00:00Z',
    reporter: { id: 5, name: 'Lisa Customer', email: 'lisa@example.com' },
    responses: [
      { id: 1, message: 'Setelah investigasi, tidak ditemukan bukti yang mendukung keluhan ini.', createdAt: '2026-01-26T14:00:00Z', adminName: 'Admin' },
    ],
  },
];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'USER' | 'DELIVERER'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setComplaints(mockComplaints);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusIcon = (status: Complaint['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={14} />;
      case 'IN_PROGRESS':
        return <AlertCircle size={14} />;
      case 'RESOLVED':
        return <CheckCircle size={14} />;
      case 'REJECTED':
        return <XCircle size={14} />;
    }
  };

  const getPriorityBadge = (priority: Complaint['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-600';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-600';
      case 'HIGH':
        return 'bg-red-100 text-red-600';
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filterType !== 'ALL' && c.type !== filterType) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery && !c.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.reporter.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'PENDING').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  const handleSendResponse = () => {
    if (!responseText.trim() || !selectedComplaint) return;
    
    // Add response to complaint (mock)
    const newResponse = {
      id: Date.now(),
      message: responseText,
      createdAt: new Date().toISOString(),
      adminName: 'Admin',
    };
    
    setSelectedComplaint({
      ...selectedComplaint,
      responses: [...selectedComplaint.responses, newResponse],
      status: 'IN_PROGRESS',
    });
    setResponseText('');
  };

  const handleUpdateStatus = (status: Complaint['status']) => {
    if (!selectedComplaint) return;
    
    setSelectedComplaint({ ...selectedComplaint, status });
    setComplaints(complaints.map(c => 
      c.id === selectedComplaint.id ? { ...c, status } : c
    ));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Keluhan</h1>
        <p className="text-sm text-gray-500">Kelola keluhan dari user dan driver</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <MessageSquare size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Keluhan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Menunggu</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">Diproses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-xs text-gray-500">Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari keluhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm w-full sm:w-auto justify-between"
            >
              <Filter size={16} />
              <span>{filterType === 'ALL' ? 'Semua Tipe' : filterType === 'USER' ? 'User' : 'Driver'}</span>
              <ChevronDown size={16} />
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full mt-1 left-0 right-0 sm:right-auto sm:w-40 bg-white border rounded-lg shadow-lg z-10">
                {(['ALL', 'USER', 'DELIVERER'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setShowTypeDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {type === 'ALL' ? 'Semua Tipe' : type === 'USER' ? 'User' : 'Driver'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm w-full sm:w-auto justify-between"
            >
              <span>{filterStatus === 'ALL' ? 'Semua Status' : filterStatus}</span>
              <ChevronDown size={16} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full mt-1 left-0 right-0 sm:right-auto sm:w-40 bg-white border rounded-lg shadow-lg z-10">
                {(['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setShowStatusDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {status === 'ALL' ? 'Semua Status' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredComplaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Tidak ada keluhan yang ditemukan</p>
            </div>
          ) : (
            filteredComplaints.map(complaint => (
              <div
                key={complaint.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedComplaint(complaint); setIsDetailModalOpen(true); }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg shrink-0 ${complaint.type === 'USER' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                    {complaint.type === 'USER' ? (
                      <User size={20} className="text-blue-600" />
                    ) : (
                      <Bike size={20} className="text-orange-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800 truncate">{complaint.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadge(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        {complaint.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{complaint.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{complaint.reporter.name}</span>
                      <span>•</span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {complaint.responses.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{complaint.responses.length} balasan</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedComplaint(complaint); setIsDetailModalOpen(true); }}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedComplaint(null); setResponseText(''); }}
        title="Detail Keluhan"
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <div className={`p-3 rounded-xl shrink-0 ${selectedComplaint.type === 'USER' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                {selectedComplaint.type === 'USER' ? (
                  <User size={24} className="text-blue-600" />
                ) : (
                  <Bike size={24} className="text-orange-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{selectedComplaint.subject}</h3>
                <p className="text-sm text-gray-500">{selectedComplaint.reporter.name} • {selectedComplaint.reporter.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadge(selectedComplaint.status)}`}>
                    {getStatusIcon(selectedComplaint.status)}
                    {selectedComplaint.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedComplaint.priority)}`}>
                    Prioritas: {selectedComplaint.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700">{selectedComplaint.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(selectedComplaint.createdAt).toLocaleDateString('id-ID', { 
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>

            {/* Responses */}
            {selectedComplaint.responses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 text-sm">Balasan Admin</h4>
                {selectedComplaint.responses.map(response => (
                  <div key={response.id} className="bg-primary-50 rounded-xl p-4 ml-4 border-l-4 border-primary-500">
                    <p className="text-sm text-gray-700">{response.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {response.adminName} • {new Date(response.createdAt).toLocaleDateString('id-ID', { 
                        day: 'numeric', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'REJECTED' && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-gray-700 text-sm">Kirim Balasan</h4>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tulis balasan..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <Send size={16} />
                    Kirim Balasan
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <CheckCircle size={16} />
                    Tandai Selesai
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <XCircle size={16} />
                    Tolak
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
