'use client';

import { useEffect, useState } from 'react';
import { adminDeliverersAPI, adminVerificationAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import FilterBar from '@/components/admin/FilterBar';
import DataTable, { Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import StatCard from '@/components/admin/StatCard';
import {
  Plus,
  UserX,
  UserCheck,
  Edit,
  Eye,
  Download,
  Bike,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Deliverer {
  id: number;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  isAvailable: boolean;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  completedOrders: number;
  totalEarnings: number;
  createdAt: string;
  lastActive?: string;
}

interface DeliverersResponse {
  items: Deliverer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DeliverersOverview {
  total: number;
  active: number;
  inactive: number;
  available: number;
  verified: number;
  unverified: number;
  pendingVerification: number;
}

export default function DeliversManagementPage() {
  const router = useRouter();
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [overview, setOverview] = useState<DeliverersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  const itemsPerPage = 20;

  useEffect(() => {
    fetchDeliverers();
    fetchOverview();
  }, [currentPage, filters]);

  const fetchDeliverers = async () => {
    try {
      setLoading(true);
      const response = await adminDeliverersAPI.getAll({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (response.items) {
        setDeliverers(response.items);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else if (Array.isArray(response)) {
        setDeliverers(response);
        setTotal(response.length);
        setTotalPages(1);
      } else {
        setDeliverers([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching deliverers:', error);
      toast.error('Gagal memuat data driver');
      setDeliverers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const data = await adminDeliverersAPI.getOverview();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching deliverers overview:', error);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleToggleStatus = async (delivererId: number, currentStatus: boolean) => {
    try {
      await adminDeliverersAPI.toggleStatus(delivererId);
      toast.success(`Driver berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchDeliverers();
      fetchOverview();
    } catch (error) {
      console.error('Error toggling deliverer status:', error);
      toast.error('Gagal mengubah status driver');
    }
  };

  const handleVerify = async (delivererId: number) => {
    router.push(`/deliverers/verify/${delivererId}`);
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
  const columns: Column<Deliverer>[] = [
    {
      header: 'Driver',
      accessor: (deliverer) => (
        <div>
          <div className="font-medium text-gray-900">{deliverer.name}</div>
          <div className="text-sm text-gray-500">{deliverer.email}</div>
          <div className="text-xs text-gray-400">{deliverer.phone}</div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      accessor: (deliverer) => (
        <div>
          <div className="text-sm font-medium text-gray-700">
            {deliverer.vehicleType}
          </div>
          <div className="text-xs text-gray-500">{deliverer.vehicleNumber}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (deliverer) => (
        <div className="space-y-1">
          <StatusBadge 
            status={deliverer.isActive ? 'ACTIVE' : 'INACTIVE'} 
          />
          {deliverer.isVerified ? (
            <StatusBadge status="VERIFIED" />
          ) : (
            <StatusBadge status="UNVERIFIED" />
          )}
        </div>
      ),
    },
    {
      header: 'Availability',
      accessor: (deliverer) => (
        <StatusBadge 
          status={deliverer.isAvailable ? 'active' : 'inactive'} 
          text={deliverer.isAvailable ? 'Available' : 'Busy'}
        />
      ),
    },
    {
      header: 'Performance',
      accessor: (deliverer) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{deliverer.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <div className="text-xs text-gray-500">
            {deliverer.completedOrders || 0} orders
          </div>
        </div>
      ),
    },
    {
      header: 'Earnings',
      accessor: (deliverer) => (
        <span className="text-green-600 font-semibold text-sm">
          {formatCurrency(deliverer.totalEarnings || 0)}
        </span>
      ),
    },
    {
      header: 'Joined',
      accessor: (deliverer) => (
        <div className="text-sm text-gray-600">
          {format(new Date(deliverer.createdAt), 'dd MMM yyyy', { locale: idLocale })}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (deliverer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/deliverers/${deliverer.id}`);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {!deliverer.isVerified && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVerify(deliverer.id);
              }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Verify"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(deliverer.id, deliverer.isActive);
            }}
            className={`p-1 ${
              deliverer.isActive 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-green-600 hover:bg-green-50'
            } rounded`}
            title={deliverer.isActive ? 'Deactivate' : 'Activate'}
          >
            {deliverer.isActive ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: 'Aktif', value: 'active' },
    { label: 'Nonaktif', value: 'inactive' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-1">Kelola semua driver platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => router.push('/deliverers/register')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Register Driver
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={overview?.total || 0}
          icon={Bike}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Active Drivers"
          value={overview?.active || 0}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Available Now"
          value={overview?.available || 0}
          icon={UserCheck}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Pending Verification"
          value={overview?.pendingVerification || 0}
          icon={AlertCircle}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
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
        data={deliverers}
        keyExtractor={(deliverer) => deliverer.id.toString()}
        onRowClick={(deliverer) => router.push(`/deliverers/${deliverer.id}`)}
        loading={loading}
        emptyMessage="Tidak ada data driver"
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
