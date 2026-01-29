'use client';

import { useState } from 'react';
import { 
  BadgePercent, 
  Image as ImageIcon, 
  Ticket, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { PromoType } from '@/types/admin';

// Dummy data
const dummyPromos = [
  {
    id: '1',
    code: 'DISKON50',
    name: 'Diskon 50% New User',
    description: 'Diskon 50% untuk pengguna baru, maksimal Rp 25.000',
    type: PromoType.PERCENTAGE,
    value: 50,
    minOrderAmount: 50000,
    maxDiscountAmount: 25000,
    usageLimit: 1000,
    usageCount: 567,
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    isActive: true,
  },
  {
    id: '2',
    code: 'GRATISONGKIR',
    name: 'Gratis Ongkir',
    description: 'Gratis ongkir tanpa minimum pembelian',
    type: PromoType.FREE_DELIVERY,
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 15000,
    usageLimit: 5000,
    usageCount: 2341,
    startDate: '2024-06-01',
    endDate: '2024-07-31',
    isActive: true,
  },
  {
    id: '3',
    code: 'CASHBACK20K',
    name: 'Cashback Rp 20.000',
    description: 'Cashback Rp 20.000 untuk pembelian minimal Rp 100.000',
    type: PromoType.CASHBACK,
    value: 20000,
    minOrderAmount: 100000,
    maxDiscountAmount: 20000,
    usageLimit: 500,
    usageCount: 123,
    startDate: '2024-06-15',
    endDate: '2024-06-30',
    isActive: true,
  },
  {
    id: '4',
    code: 'WEEKEND25',
    name: 'Weekend Special',
    description: 'Diskon 25% khusus weekend',
    type: PromoType.PERCENTAGE,
    value: 25,
    minOrderAmount: 75000,
    maxDiscountAmount: 30000,
    usageLimit: 2000,
    usageCount: 2000,
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    isActive: false,
  },
];

const dummyBanners = [
  {
    id: '1',
    title: 'Promo Ramadan',
    description: 'Diskon spesial bulan Ramadan',
    imageUrl: '/placeholder-banner.jpg',
    linkType: 'PROMO',
    position: 1,
    isActive: true,
    startDate: '2024-06-01',
    endDate: '2024-06-30',
  },
  {
    id: '2',
    title: 'New Restaurant',
    description: 'Coba menu baru dari partner kami',
    imageUrl: '/placeholder-banner.jpg',
    linkType: 'MERCHANT',
    position: 2,
    isActive: true,
    startDate: '2024-06-01',
    endDate: '2024-07-31',
  },
  {
    id: '3',
    title: 'Free Delivery Week',
    description: 'Gratis ongkir selama seminggu',
    imageUrl: '/placeholder-banner.jpg',
    linkType: 'PROMO',
    position: 3,
    isActive: false,
    startDate: '2024-05-01',
    endDate: '2024-05-07',
  },
];

const dummyVouchers = [
  {
    id: '1',
    code: 'VCH-ABC123',
    promoName: 'Diskon 50% New User',
    userName: 'Ahmad Rizki',
    discountValue: 50,
    discountType: 'PERCENTAGE',
    validUntil: '2024-06-30',
    isUsed: false,
  },
  {
    id: '2',
    code: 'VCH-DEF456',
    promoName: 'Cashback Rp 20.000',
    userName: 'Sarah Wijaya',
    discountValue: 20000,
    discountType: 'FIXED_AMOUNT',
    validUntil: '2024-06-30',
    isUsed: true,
    usedAt: '2024-06-15',
  },
  {
    id: '3',
    code: 'VCH-GHI789',
    promoName: 'Gratis Ongkir',
    userName: null,
    discountValue: 15000,
    discountType: 'FREE_DELIVERY',
    validUntil: '2024-07-31',
    isUsed: false,
  },
];

const promoTypeLabels: Record<PromoType, { label: string; color: string }> = {
  [PromoType.PERCENTAGE]: { label: 'Persentase', color: 'bg-blue-100 text-blue-700' },
  [PromoType.FIXED_AMOUNT]: { label: 'Nominal', color: 'bg-green-100 text-green-700' },
  [PromoType.FREE_DELIVERY]: { label: 'Free Ongkir', color: 'bg-purple-100 text-purple-700' },
  [PromoType.BUY_ONE_GET_ONE]: { label: 'BOGO', color: 'bg-orange-100 text-orange-700' },
  [PromoType.CASHBACK]: { label: 'Cashback', color: 'bg-cyan-100 text-cyan-700' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PromosPage() {
  const [activeTab, setActiveTab] = useState<'promos' | 'banners' | 'vouchers'>('promos');
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'promos', label: 'Promo', icon: BadgePercent, count: dummyPromos.length },
    { id: 'banners', label: 'Banner', icon: ImageIcon, count: dummyBanners.length },
    { id: 'vouchers', label: 'Voucher', icon: Ticket, count: dummyVouchers.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
          <Plus size={16} />
          Tambah {activeTab === 'promos' ? 'Promo' : activeTab === 'banners' ? 'Banner' : 'Voucher'}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Cari ${activeTab === 'promos' ? 'promo' : activeTab === 'banners' ? 'banner' : 'voucher'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promos Tab */}
      {activeTab === 'promos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Promo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nilai</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Penggunaan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Periode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dummyPromos.map((promo) => {
                  const typeStyle = promoTypeLabels[promo.type];
                  const usagePercent = (promo.usageCount / promo.usageLimit) * 100;
                  return (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-primary-600">
                              {promo.code}
                            </code>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Copy size={14} />
                            </button>
                          </div>
                          <p className="font-medium text-gray-900 mt-1">{promo.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{promo.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {promo.type === PromoType.PERCENTAGE 
                              ? `${promo.value}%` 
                              : promo.type === PromoType.FREE_DELIVERY
                              ? 'Gratis'
                              : formatCurrency(promo.value)
                            }
                          </p>
                          {promo.maxDiscountAmount > 0 && (
                            <p className="text-xs text-gray-500">Maks: {formatCurrency(promo.maxDiscountAmount)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {promo.usageCount.toLocaleString()} / {promo.usageLimit.toLocaleString()}
                          </p>
                          <div className="w-24 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>{promo.startDate}</span>
                          <span>-</span>
                          <span>{promo.endDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {promo.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={12} />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <XCircle size={12} />
                            Non-aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                            <Eye size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyBanners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Banner Preview */}
              <div className="aspect-[16/9] bg-gradient-to-r from-primary-500 to-purple-500 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="text-white/50" size={48} />
                </div>
                <div className="absolute top-2 right-2">
                  {banner.isActive ? (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
                      Non-aktif
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded">
                    Position: {banner.position}
                  </span>
                </div>
              </div>

              {/* Banner Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{banner.description}</p>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>{banner.startDate} - {banner.endDate}</span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <Tag size={12} className="text-gray-400" />
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{banner.linkType}</span>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                    <Edit size={14} className="inline mr-1" />
                    Edit
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vouchers Tab */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          {/* Generate Vouchers Card */}
          <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Generate Voucher Codes</h3>
                <p className="text-white/80 text-sm mt-1">Buat voucher codes secara bulk untuk kampanye marketing</p>
              </div>
              <button className="px-4 py-2 bg-white text-primary-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                <Plus size={16} className="inline mr-1" />
                Generate Vouchers
              </button>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kode</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Promo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nilai</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Valid Until</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dummyVouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-primary-600">
                            {voucher.code}
                          </code>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{voucher.promoName}</span>
                      </td>
                      <td className="px-6 py-4">
                        {voucher.userName ? (
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="text-gray-900">{voucher.userName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {voucher.discountType === 'PERCENTAGE'
                            ? `${voucher.discountValue}%`
                            : formatCurrency(voucher.discountValue)
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{voucher.validUntil}</span>
                      </td>
                      <td className="px-6 py-4">
                        {voucher.isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <CheckCircle2 size={12} />
                            Digunakan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Clock size={12} />
                            Tersedia
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!voucher.isUsed && (
                            <>
                              <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                                <Users size={18} />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
