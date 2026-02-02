'use client';

import { useEffect, useState } from 'react';
import { adminOrdersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import FilterBar from '@/components/admin/FilterBar';
import DataTable, { Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  Package,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Order {
  id: number;
  orderNumber: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  merchant: {
    id: number;
    businessName: string;
  };
  deliverer?: {
    id: number;
    name: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryFee: number;
  platformFee: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OrdersManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminOrdersAPI.getAll({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (response.items) {
        setOrders(response.items);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else if (Array.isArray(response)) {
        setOrders(response);
        setTotal(response.length);
        setTotalPages(1);
      } else {
        setOrders([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat data pesanan');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    if (!confirm(`Ubah status order menjadi ${newStatus}?`)) return;

    try {
      await adminOrdersAPI.updateStatus(orderId, newStatus);
      toast.success('Status order berhasil diperbarui');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Gagal memperbarui status order');
    }
  };

  const handleExport = async () => {
    toast.info('Export feature coming soon');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Table columns
  const columns: Column<Order>[] = [
    {
      header: 'Order Number',
      accessor: (order) => (
        <div className="font-medium text-blue-600">
          {order.orderNumber}
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (order) => (
        <div>
          <div className="font-medium text-gray-900">{order.customer?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{order.customer?.email || ''}</div>
        </div>
      ),
    },
    {
      header: 'Merchant',
      accessor: (order) => order.merchant?.businessName || 'N/A',
      className: 'text-gray-700',
    },
    {
      header: 'Driver',
      accessor: (order) => order.deliverer?.name || '-',
      className: 'text-gray-600',
    },
    {
      header: 'Status',
      accessor: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: 'Total',
      accessor: (order) => (
        <div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(order.totalAmount)}
          </div>
          <div className="text-xs text-gray-500">
            Fee: {formatCurrency(order.platformFee || 0)}
          </div>
        </div>
      ),
    },
    {
      header: 'Order Date',
      accessor: (order) => (
        <div className="text-sm">
          {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: idLocale })}
          <div className="text-xs text-gray-500">
            {format(new Date(order.createdAt), 'HH:mm', { locale: idLocale })}
          </div>
        </div>
      ),
      className: 'text-gray-600',
    },
    {
      header: 'Actions',
      accessor: (order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/orders/${order.id}`);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {order.status === 'PENDING' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(order.id, 'PROCESSING');
              }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Process Order"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(order.id, 'CANCELLED');
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Cancel Order"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'On Delivery', value: 'ON_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const processingOrders = orders.filter((o) => o.status === 'PROCESSING').length;
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Kelola semua pesanan platform</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export Orders
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">{pendingOrders}</div>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Processing</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{processingOrders}</div>
            </div>
            <Package className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{completedOrders}</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Cancelled</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{cancelledOrders}</div>
            </div>
            <XCircle className="h-8 w-8 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={filters.search}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        onSearchSubmit={handleSearch}
        filters={[
          {
            label: 'Semua Status',
            name: 'status',
            value: filters.status,
            options: statusOptions,
            onChange: (value) => {
              setFilters({ ...filters, status: value });
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(order) => order.id.toString()}
        onRowClick={(order) => router.push(`/orders/${order.id}`)}
        loading={loading}
        emptyMessage="Tidak ada data pesanan"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
