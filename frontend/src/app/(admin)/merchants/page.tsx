'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Store, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Star,
  MapPin,
  Phone,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { MerchantStatus } from '@/types/admin';

// Dummy data for merchants
const dummyMerchants = [
  {
    id: '1',
    name: 'Warung Padang Sederhana',
    description: 'Masakan Padang autentik dengan bumbu rempah pilihan',
    address: 'Jl. Sudirman No. 123, Jakarta Selatan',
    city: 'Jakarta',
    phone: '081234567890',
    email: 'warungpadang@email.com',
    logoUrl: '/placeholder-restaurant.jpg',
    status: MerchantStatus.ACTIVE,
    isOpen: true,
    rating: 4.8,
    totalReviews: 234,
    totalOrders: 1520,
    commissionRate: 15,
    createdAt: '2024-01-15T10:00:00Z',
    pendingDocuments: 0,
    user: { name: 'Ahmad Rizki', email: 'ahmad@email.com' },
  },
  {
    id: '2',
    name: 'Sushi Tei Express',
    description: 'Japanese cuisine dengan kualitas premium',
    address: 'Jl. Thamrin No. 456, Jakarta Pusat',
    city: 'Jakarta',
    phone: '081234567891',
    email: 'sushitei@email.com',
    logoUrl: '/placeholder-restaurant.jpg',
    status: MerchantStatus.ACTIVE,
    isOpen: false,
    rating: 4.6,
    totalReviews: 189,
    totalOrders: 980,
    commissionRate: 18,
    createdAt: '2024-02-20T10:00:00Z',
    pendingDocuments: 0,
    user: { name: 'Kenji Tanaka', email: 'kenji@email.com' },
  },
  {
    id: '3',
    name: 'Bakso Solo Pak Min',
    description: 'Bakso sapi segar dengan kuah kaldu spesial',
    address: 'Jl. Gatot Subroto No. 789, Jakarta Selatan',
    city: 'Jakarta',
    phone: '081234567892',
    email: 'baksosolo@email.com',
    logoUrl: '/placeholder-restaurant.jpg',
    status: MerchantStatus.PENDING,
    isOpen: false,
    rating: 0,
    totalReviews: 0,
    totalOrders: 0,
    commissionRate: 15,
    createdAt: '2024-06-01T10:00:00Z',
    pendingDocuments: 3,
    user: { name: 'Pak Minto', email: 'pakminto@email.com' },
  },
  {
    id: '4',
    name: 'Ayam Geprek Bensu',
    description: 'Ayam geprek dengan level pedas sesuai selera',
    address: 'Jl. Kuningan No. 321, Jakarta Selatan',
    city: 'Jakarta',
    phone: '081234567893',
    email: 'geprekbensu@email.com',
    logoUrl: '/placeholder-restaurant.jpg',
    status: MerchantStatus.SUSPENDED,
    isOpen: false,
    rating: 4.2,
    totalReviews: 567,
    totalOrders: 2340,
    commissionRate: 15,
    createdAt: '2023-11-10T10:00:00Z',
    pendingDocuments: 1,
    user: { name: 'Budi Santoso', email: 'budi@email.com' },
  },
  {
    id: '5',
    name: 'Kedai Kopi Nusantara',
    description: 'Kopi lokal dari berbagai daerah Indonesia',
    address: 'Jl. Kemang Raya No. 567, Jakarta Selatan',
    city: 'Jakarta',
    phone: '081234567894',
    email: 'kopinusantara@email.com',
    logoUrl: '/placeholder-restaurant.jpg',
    status: MerchantStatus.ACTIVE,
    isOpen: true,
    rating: 4.9,
    totalReviews: 412,
    totalOrders: 3200,
    commissionRate: 12,
    createdAt: '2023-08-25T10:00:00Z',
    pendingDocuments: 0,
    user: { name: 'Sarah Wijaya', email: 'sarah@email.com' },
  },
];

// Stats cards
const stats = [
  { label: 'Total Merchant', value: 156, icon: Store, color: 'bg-blue-500', change: '+12%' },
  { label: 'Merchant Aktif', value: 142, icon: CheckCircle2, color: 'bg-green-500', change: '+8%' },
  { label: 'Pending Verifikasi', value: 8, icon: Clock, color: 'bg-yellow-500', change: '-2' },
  { label: 'Suspended', value: 6, icon: XCircle, color: 'bg-red-500', change: '+1' },
];

const statusColors: Record<MerchantStatus, { bg: string; text: string; label: string }> = {
  [MerchantStatus.ACTIVE]: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
  [MerchantStatus.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  [MerchantStatus.SUSPENDED]: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
  [MerchantStatus.CLOSED]: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Tutup' },
};

export default function MerchantsPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const [merchants, setMerchants] = useState(dummyMerchants);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Set status filter from URL query parameter
  useEffect(() => {
    if (filterParam === 'pending') {
      setStatusFilter('PENDING');
    } else if (filterParam) {
      setStatusFilter(filterParam.toUpperCase());
    } else {
      setStatusFilter('all');
    }
  }, [filterParam]);

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = merchant.name.toLowerCase().includes(search.toLowerCase()) ||
                         merchant.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || merchant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-1">{stat.change} dari bulan lalu</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari merchant berdasarkan nama atau alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Semua Status</option>
              <option value={MerchantStatus.ACTIVE}>Aktif</option>
              <option value={MerchantStatus.PENDING}>Pending</option>
              <option value={MerchantStatus.SUSPENDED}>Suspended</option>
              <option value={MerchantStatus.CLOSED}>Tutup</option>
            </select>
          </div>

          {/* Add Button */}
          <button className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium">
            + Tambah Merchant
          </button>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Pesanan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Komisi
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dokumen
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMerchants.map((merchant) => {
                const statusStyle = statusColors[merchant.status];
                return (
                  <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Store className="text-gray-400" size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{merchant.name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <MapPin size={12} />
                            <span className="truncate max-w-50">{merchant.address}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <Phone size={12} />
                            <span>{merchant.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        {merchant.isOpen ? (
                          <span className="text-xs text-green-600">● Buka</span>
                        ) : (
                          <span className="text-xs text-gray-400">○ Tutup</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <span className="font-semibold text-gray-900">{merchant.rating || '-'}</span>
                        <span className="text-sm text-gray-500">({merchant.totalReviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{merchant.totalOrders.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{merchant.commissionRate}%</span>
                    </td>
                    <td className="px-6 py-4">
                      {merchant.pendingDocuments > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <AlertCircle size={12} />
                          {merchant.pendingDocuments} pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 size={12} />
                          Lengkap
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/merchants/${merchant.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-medium">{filteredMerchants.length}</span> dari <span className="font-medium">{merchants.length}</span> merchant
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg">
              1
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
