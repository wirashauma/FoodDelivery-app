'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import { complaintsAPI } from '@/lib/api';
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
  RefreshCw,
} from 'lucide-react';

// Types
interface Complaint {
  id: number;
  type: 'USER' | 'DELIVERER';
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
  reporter: {
    user_id: number;
    nama: string;
    email: string;
  };
  responses: {
    id: number;
    message: string;
    created_at: string;
    admin: { nama: string };
  }[];
}

interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({ total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'USER' | 'DELIVERER'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      
      const response = await complaintsAPI.getAll(params);
      setComplaints(response.data || []);
      setStats(response.stats || { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

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
        !c.reporter.nama?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selectedComplaint || sendingResponse) return;
    
    setSendingResponse(true);
    try {
      const response = await complaintsAPI.addResponse(selectedComplaint.id, responseText);
      setSelectedComplaint(response.data);
      // Update in list
      setComplaints(complaints.map(c => 
        c.id === selectedComplaint.id ? response.data : c
      ));
      setResponseText('');
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Gagal mengirim balasan');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleUpdateStatus = async (status: Complaint['status']) => {
    if (!selectedComplaint) return;
    
    try {
      const response = await complaintsAPI.updateStatus(selectedComplaint.id, status);
      setSelectedComplaint(response.data);
      setComplaints(complaints.map(c => 
        c.id === selectedComplaint.id ? response.data : c
      ));
      // Refresh stats
      loadComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengubah status');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Keluhan</h1>
          <p className="text-sm text-gray-500">Kelola keluhan dari user dan driver</p>
        </div>
        <button
          onClick={loadComplaints}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
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
                      <span>{complaint.reporter.nama || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(complaint.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {complaint.responses && complaint.responses.length > 0 && (
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
                <p className="text-sm text-gray-500">{selectedComplaint.reporter.nama || 'Unknown'} • {selectedComplaint.reporter.email}</p>
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
                {new Date(selectedComplaint.created_at).toLocaleDateString('id-ID', { 
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>

            {/* Responses */}
            {selectedComplaint.responses && selectedComplaint.responses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 text-sm">Balasan Admin</h4>
                {selectedComplaint.responses.map(response => (
                  <div key={response.id} className="bg-primary-50 rounded-xl p-4 ml-4 border-l-4 border-primary-500">
                    <p className="text-sm text-gray-700">{response.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {response.admin?.nama || 'Admin'} • {new Date(response.created_at).toLocaleDateString('id-ID', { 
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
                  disabled={sendingResponse}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none disabled:bg-gray-100"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseText.trim() || sendingResponse}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <Send size={16} />
                    {sendingResponse ? 'Mengirim...' : 'Kirim Balasan'}
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
