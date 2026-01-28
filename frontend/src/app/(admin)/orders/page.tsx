'use client';

import { useEffect, useState, useCallback } from 'react';
import { ordersAPI, exportAPI } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { Order } from '@/types';
import { format } from 'date-fns';
import { Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getAll(page, 10, statusFilter, startDate, endDate);
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setActionLoading(true);
    try {
      await ordersAPI.updateStatus(selectedOrder.order_id, newStatus);
      toast.success(`Status pesanan #${selectedOrder.order_id} berhasil diperbarui`);
      setIsStatusModalOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Gagal memperbarui status pesanan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.loading('Mengekspor data...', { id: 'export' });
      const blob = await exportAPI.orders();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data berhasil diekspor', { id: 'export' });
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Gagal mengekspor data', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    { key: 'order_id', label: 'Order ID', render: (o: Order) => `#${o.order_id}` },
    {
      key: 'user.username',
      label: 'Customer',
      render: (o: Order) => o.user?.username || 'Guest',
    },
    {
      key: 'store.name',
      label: 'Store',
      render: (o: Order) => o.store?.name || 'N/A',
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (o: Order) => formatCurrency(o.total_amount),
    },
    {
      key: 'delivery_fee',
      label: 'Delivery Fee',
      render: (o: Order) => formatCurrency(o.delivery_fee),
    },
    {
      key: 'status',
      label: 'Status',
      render: (o: Order) => <StatusBadge status={o.status} type="order" />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (o: Order) => format(new Date(o.created_at), 'MMM dd, yyyy HH:mm'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (o: Order) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedOrder(o);
              setIsDetailModalOpen(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                setSelectedOrder(o);
                setNewStatus(o.status);
                setIsStatusModalOpen(true);
              }}
              className="px-2 py-1 text-xs bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors"
            >
              Update
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-sm text-gray-500">View and manage all orders</p>
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

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">All Status</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="w-full px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        emptyMessage="No orders found"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        title={`Order #${selectedOrder?.order_id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 sm:space-y-6">
            {/* Order Status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={selectedOrder.status} type="order" />
              <span className="text-xs sm:text-sm text-gray-500">
                {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>

            {/* Customer & Store Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Customer</p>
                <p className="font-medium text-sm sm:text-base truncate">{selectedOrder.user?.username || 'Guest'}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedOrder.user?.email}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Store</p>
                <p className="font-medium text-sm sm:text-base truncate">{selectedOrder.store?.name || 'N/A'}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedOrder.store?.address}</p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Delivery Address</p>
              <p className="font-medium text-sm sm:text-base">{selectedOrder.delivery_address}</p>
              {selectedOrder.deliverer && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-500">Deliverer</p>
                  <p className="font-medium text-sm sm:text-base">{selectedOrder.deliverer.user?.username}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div>
                <p className="font-medium mb-2 text-sm sm:text-base">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.order_item_id} className="flex justify-between gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{item.menu_item?.name || 'Item'}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm sm:text-base shrink-0">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(selectedOrder.total_amount - selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-500">Delivery Fee</span>
                <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base sm:text-lg">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Notes</p>
                <p className="text-sm sm:text-base">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedOrder(null);
          setNewStatus('');
        }}
        title="Update Order Status"
        size="sm"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 sm:gap-3 justify-end">
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedOrder(null);
                setNewStatus('');
              }}
              className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={actionLoading}
              className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              {actionLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
