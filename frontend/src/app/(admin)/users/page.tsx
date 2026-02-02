'use client';

import { useEffect, useState, useCallback } from 'react';
import { usersAPI, exportAPI } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { User } from '@/types';
import { format } from 'date-fns';
import { Eye, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll(page, 10, searchQuery);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await usersAPI.delete(selectedUser.user_id);
      toast.success(`Pengguna ${selectedUser.username} berhasil dihapus`);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus pengguna');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.loading('Mengekspor data...', { id: 'export' });
      const response = await exportAPI.users();
      
      // Ensure we have valid blob data
      const blob = response instanceof Blob ? response : new Blob([JSON.stringify(response)], { type: 'text/csv' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data berhasil diekspor', { id: 'export' });
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Gagal mengekspor data', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'user_id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'Phone', render: (user: User) => user.phone_number || '-' },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => <StatusBadge status={user.role} type="user" />,
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (user: User) => format(new Date(user.created_at), 'MMM dd, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsDetailModalOpen(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsDeleteModalOpen(true);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Users Management</h1>
          <p className="text-sm text-gray-500">Manage all registered users</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          <Download size={18} />
          <span>{exporting ? 'Mengekspor...' : 'Export CSV'}</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onSearch={handleSearch}
        searchPlaceholder="Search by username or email..."
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        emptyMessage="No users found"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-primary-600">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">{selectedUser.username}</h3>
                <p className="text-gray-500 text-sm sm:text-base truncate">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">User ID</p>
                <p className="font-medium text-sm sm:text-base">{selectedUser.user_id}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Role</p>
                <StatusBadge status={selectedUser.role} type="user" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                <p className="font-medium text-sm sm:text-base">{selectedUser.phone_number || '-'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Joined</p>
                <p className="font-medium text-sm sm:text-base">
                  {format(new Date(selectedUser.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Are you sure you want to delete user <strong>{selectedUser?.username}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 sm:gap-3 justify-end">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
              className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
