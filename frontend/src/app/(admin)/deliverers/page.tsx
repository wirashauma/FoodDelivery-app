'use client';

import { useEffect, useState } from 'react';
import { deliverersAPI } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { DelivererProfile } from '@/types';
import { format } from 'date-fns';
import { Eye, Check, X, UserPlus } from 'lucide-react';

export default function DeliverersPage() {
  const [deliverers, setDeliverers] = useState<DelivererProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDeliverer, setSelectedDeliverer] = useState<DelivererProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    phone_number: '',
    vehicle_type: '',
    license_plate: '',
  });

  useEffect(() => {
    const loadDeliverers = async () => {
      setLoading(true);
      try {
        const response = await deliverersAPI.getAll(page, 10, statusFilter);
        setDeliverers(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching deliverers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDeliverers();
  }, [page, statusFilter]);

  const fetchDeliverers = async () => {
    setLoading(true);
    try {
      const response = await deliverersAPI.getAll(page, 10, statusFilter);
      setDeliverers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching deliverers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deliverer: DelivererProfile) => {
    setActionLoading(true);
    try {
      await deliverersAPI.approve(deliverer.deliverer_id);
      fetchDeliverers();
    } catch (error) {
      console.error('Error approving deliverer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeliverer || !rejectionReason) return;
    setActionLoading(true);
    try {
      await deliverersAPI.reject(selectedDeliverer.deliverer_id, rejectionReason);
      setIsRejectModalOpen(false);
      setSelectedDeliverer(null);
      setRejectionReason('');
      fetchDeliverers();
    } catch (error) {
      console.error('Error rejecting deliverer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await deliverersAPI.register(registerForm);
      setIsRegisterModalOpen(false);
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        vehicle_type: '',
        license_plate: '',
      });
      fetchDeliverers();
    } catch (error) {
      console.error('Error registering deliverer:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to register deliverer');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'deliverer_id', label: 'ID' },
    {
      key: 'user.username',
      label: 'Name',
      render: (d: DelivererProfile) => d.user?.username || 'N/A',
    },
    {
      key: 'user.email',
      label: 'Email',
      render: (d: DelivererProfile) => d.user?.email || 'N/A',
    },
    { key: 'vehicle_type', label: 'Vehicle', render: (d: DelivererProfile) => d.vehicle_type || '-' },
    { key: 'license_plate', label: 'License', render: (d: DelivererProfile) => d.license_plate || '-' },
    { key: 'total_deliveries', label: 'Deliveries' },
    { key: 'rating', label: 'Rating', render: (d: DelivererProfile) => d.rating?.toFixed(1) || '0.0' },
    {
      key: 'status',
      label: 'Status',
      render: (d: DelivererProfile) => <StatusBadge status={d.status} type="deliverer" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d: DelivererProfile) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedDeliverer(d);
              setIsDetailModalOpen(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {d.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleApprove(d)}
                disabled={actionLoading}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setSelectedDeliverer(d);
                  setIsRejectModalOpen(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Reject"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deliverers Management</h1>
          <p className="text-gray-500">Manage delivery partners</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus size={18} />
            Register Deliverer
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={deliverers}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        emptyMessage="No deliverers found"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDeliverer(null);
        }}
        title="Deliverer Details"
        size="lg"
      >
        {selectedDeliverer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">
                  {selectedDeliverer.user?.username?.charAt(0).toUpperCase() || 'D'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedDeliverer.user?.username}</h3>
                <p className="text-gray-500">{selectedDeliverer.user?.email}</p>
                <StatusBadge status={selectedDeliverer.status} type="deliverer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Vehicle Type</p>
                <p className="font-medium">{selectedDeliverer.vehicle_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">License Plate</p>
                <p className="font-medium">{selectedDeliverer.license_plate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="font-medium">{selectedDeliverer.total_deliveries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-medium">⭐ {selectedDeliverer.rating?.toFixed(1) || '0.0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Availability</p>
                <p className="font-medium">{selectedDeliverer.is_available ? '🟢 Available' : '🔴 Not Available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registered</p>
                <p className="font-medium">
                  {format(new Date(selectedDeliverer.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              {selectedDeliverer.rejection_reason && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Rejection Reason</p>
                  <p className="font-medium text-red-600">{selectedDeliverer.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedDeliverer(null);
          setRejectionReason('');
        }}
        title="Reject Deliverer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting <strong>{selectedDeliverer?.user?.username}</strong>.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedDeliverer(null);
                setRejectionReason('');
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Register Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setRegisterForm({
            username: '',
            email: '',
            password: '',
            phone_number: '',
            vehicle_type: '',
            license_plate: '',
          });
        }}
        title="Register New Deliverer"
        size="lg"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={registerForm.phone_number}
                onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={registerForm.vehicle_type}
                onChange={(e) => setRegisterForm({ ...registerForm, vehicle_type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select vehicle</option>
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="BICYCLE">Bicycle</option>
                <option value="CAR">Car</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
              <input
                type="text"
                value={registerForm.license_plate}
                onChange={(e) => setRegisterForm({ ...registerForm, license_plate: e.target.value })}
                placeholder="e.g., B 1234 XYZ"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
