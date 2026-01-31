'use client';

import { useState } from 'react';
import { 
  Tag, 
  UtensilsCrossed, 
  MapPin, 
  Cog,
  Plus,
  Search,
  Edit,
  Trash2,
  GripVertical,
  ChevronRight,
  Save,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// Dummy data
const dummyCategories = [
  { id: '1', name: 'Makanan', description: 'Semua jenis makanan', imageUrl: null, sortOrder: 1, isActive: true, childCount: 5 },
  { id: '2', name: 'Minuman', description: 'Semua jenis minuman', imageUrl: null, sortOrder: 2, isActive: true, childCount: 3 },
  { id: '3', name: 'Snack', description: 'Camilan dan makanan ringan', imageUrl: null, sortOrder: 3, isActive: true, childCount: 4 },
  { id: '4', name: 'Dessert', description: 'Makanan penutup dan kue', imageUrl: null, sortOrder: 4, isActive: true, childCount: 2 },
  { id: '5', name: 'Sehat', description: 'Makanan sehat dan diet', imageUrl: null, sortOrder: 5, isActive: false, childCount: 0 },
];

const dummyCuisineTypes = [
  { id: '1', name: 'Indonesia', description: 'Masakan khas Indonesia', sortOrder: 1, isActive: true, merchantCount: 45 },
  { id: '2', name: 'Japanese', description: 'Masakan Jepang', sortOrder: 2, isActive: true, merchantCount: 23 },
  { id: '3', name: 'Chinese', description: 'Masakan Cina', sortOrder: 3, isActive: true, merchantCount: 18 },
  { id: '4', name: 'Korean', description: 'Masakan Korea', sortOrder: 4, isActive: true, merchantCount: 15 },
  { id: '5', name: 'Western', description: 'Masakan Barat', sortOrder: 5, isActive: true, merchantCount: 12 },
  { id: '6', name: 'Thai', description: 'Masakan Thailand', sortOrder: 6, isActive: true, merchantCount: 8 },
  { id: '7', name: 'Indian', description: 'Masakan India', sortOrder: 7, isActive: false, merchantCount: 3 },
];

const dummyDeliveryZones = [
  { id: '1', name: 'Jakarta Selatan', city: 'Jakarta', baseDeliveryFee: 8000, pricePerKm: 2500, maxDistance: 10, isActive: true },
  { id: '2', name: 'Jakarta Pusat', city: 'Jakarta', baseDeliveryFee: 8000, pricePerKm: 2500, maxDistance: 8, isActive: true },
  { id: '3', name: 'Jakarta Barat', city: 'Jakarta', baseDeliveryFee: 10000, pricePerKm: 3000, maxDistance: 12, isActive: true },
  { id: '4', name: 'Jakarta Timur', city: 'Jakarta', baseDeliveryFee: 10000, pricePerKm: 3000, maxDistance: 12, isActive: true },
  { id: '5', name: 'Jakarta Utara', city: 'Jakarta', baseDeliveryFee: 12000, pricePerKm: 3500, maxDistance: 15, isActive: false },
];

const dummySettings = [
  { key: 'platform_fee_percentage', value: '5', description: 'Platform fee percentage per order', category: 'financial' },
  { key: 'default_commission_rate', value: '15', description: 'Default merchant commission rate', category: 'financial' },
  { key: 'min_order_amount', value: '20000', description: 'Minimum order amount', category: 'order' },
  { key: 'max_delivery_distance', value: '15', description: 'Maximum delivery distance in km', category: 'delivery' },
  { key: 'driver_assignment_radius', value: '5', description: 'Driver assignment radius in km', category: 'delivery' },
  { key: 'order_timeout_minutes', value: '30', description: 'Order timeout in minutes', category: 'order' },
  { key: 'support_email', value: 'support@titipin.id', description: 'Support email address', category: 'general' },
  { key: 'support_phone', value: '021-12345678', description: 'Support phone number', category: 'general' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function MasterDataCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'cuisines' | 'zones' | 'settings'>('categories');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const tabs = [
    { id: 'categories', label: 'Kategori', icon: Tag, count: dummyCategories.length },
    { id: 'cuisines', label: 'Jenis Masakan', icon: UtensilsCrossed, count: dummyCuisineTypes.length },
    { id: 'zones', label: 'Zona Pengiriman', icon: MapPin, count: dummyDeliveryZones.length },
    { id: 'settings', label: 'Pengaturan', icon: Cog, count: dummySettings.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
        {activeTab !== 'settings' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
            <Plus size={16} />
            Tambah {activeTab === 'categories' ? 'Kategori' : activeTab === 'cuisines' ? 'Masakan' : 'Zona'}
          </button>
        )}
      </div>

      {/* Search */}
      {activeTab !== 'settings' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Cari ${activeTab === 'categories' ? 'kategori' : activeTab === 'cuisines' ? 'jenis masakan' : 'zona'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-8"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Deskripsi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sub-kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dummyCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                      <button className="text-gray-300 hover:text-gray-500 cursor-grab">
                        <GripVertical size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Tag className="text-primary-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{category.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900">{category.childCount}</span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {category.isActive ? (
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cuisine Types Tab */}
      {activeTab === 'cuisines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyCuisineTypes.map((cuisine) => (
            <div key={cuisine.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <UtensilsCrossed className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cuisine.name}</h3>
                    <p className="text-sm text-gray-500">{cuisine.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                    <Edit size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {cuisine.merchantCount} merchant
                </span>
                {cuisine.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Non-aktif
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Zones Tab */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Zona</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kota</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Base Fee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Per KM</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Max Distance</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dummyDeliveryZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="text-blue-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{zone.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{formatCurrency(zone.baseDeliveryFee)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{formatCurrency(zone.pricePerKm)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{zone.maxDistance} km</span>
                    </td>
                    <td className="px-6 py-4">
                      {zone.isActive ? (
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Group by category */}
          {['financial', 'order', 'delivery', 'general'].map((category) => {
            const categorySettings = dummySettings.filter(s => s.category === category);
            const categoryLabels: Record<string, string> = {
              financial: 'Keuangan',
              order: 'Pesanan',
              delivery: 'Pengiriman',
              general: 'Umum',
            };
            
            return (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{categoryLabels[category]}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {categorySettings.map((setting) => (
                    <div key={setting.key} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <code className="text-sm font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          {setting.key}
                        </code>
                        <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingId === setting.key ? (
                          <>
                            <input
                              type="text"
                              defaultValue={setting.value}
                              className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                              {setting.value}
                            </span>
                            <button 
                              onClick={() => setEditingId(setting.key)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                            >
                              <Edit size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
