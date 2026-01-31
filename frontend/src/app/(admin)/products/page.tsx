'use client';

import { useEffect, useState } from 'react';
import { productsAPI, restaurantsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Store,
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  MapPin,
} from 'lucide-react';

interface Restaurant {
  id: number;
  nama: string;
  deskripsi: string | null;
  alamat: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

interface Product {
  id: number;
  nama: string;
  deskripsi: string;
  harga: number;
  imageUrl: string;
  kategori: string;
  isAvailable: boolean;
  restaurantId: number | null;
  restaurant?: { id: number; nama: string } | null;
}

type ModalType = 'restaurant' | 'product' | null;

export default function ProductsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'restaurants' | 'products'>('restaurants');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRestaurant, setExpandedRestaurant] = useState<number | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<Restaurant | Product | null>(null);
  const [, setSelectedRestaurantId] = useState<number | null>(null);
  
  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'restaurant' | 'product';
    id: number;
    name: string;
  }>({ isOpen: false, type: 'restaurant', id: 0, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    alamat: '',
    imageUrl: '',
    harga: '',
    kategori: '',
    restaurantId: '',
    isActive: true,
    isAvailable: true,
  });
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const kategoriOptions = ['Makanan', 'Minuman', 'Snack', 'Dessert', 'Lainnya'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restaurantData, productData] = await Promise.all([
        restaurantsAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setRestaurants(restaurantData);
      setProducts(productData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: ModalType, item?: Restaurant | Product, restaurantId?: number) => {
    setModalType(type);
    setEditingItem(item || null);
    setSelectedRestaurantId(restaurantId || null);
    setSelectedImage(null);
    
    if (item) {
      if (type === 'restaurant') {
        const rest = item as Restaurant;
        setFormData({
          nama: rest.nama,
          deskripsi: rest.deskripsi || '',
          alamat: rest.alamat,
          imageUrl: rest.imageUrl || '',
          harga: '',
          kategori: '',
          restaurantId: '',
          isActive: rest.isActive,
          isAvailable: true,
        });
        setImagePreview(rest.imageUrl || null);
      } else {
        const prod = item as Product;
        setFormData({
          nama: prod.nama,
          deskripsi: prod.deskripsi,
          alamat: '',
          imageUrl: prod.imageUrl,
          harga: prod.harga.toString(),
          kategori: prod.kategori,
          restaurantId: prod.restaurantId?.toString() || '',
          isActive: true,
          isAvailable: prod.isAvailable,
        });
        setImagePreview(prod.imageUrl || null);
      }
    } else {
      setImagePreview(null);
      setFormData({
        nama: '',
        deskripsi: '',
        alamat: '',
        imageUrl: '',
        harga: '',
        kategori: 'Makanan',
        restaurantId: restaurantId?.toString() || '',
        isActive: true,
        isAvailable: true,
      });
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setEditingItem(null);
    setSelectedRestaurantId(null);
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalType === 'restaurant') {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('nama', formData.nama);
        if (formData.deskripsi) formDataToSend.append('deskripsi', formData.deskripsi);
        formDataToSend.append('alamat', formData.alamat);
        formDataToSend.append('isActive', formData.isActive.toString());
        
        if (selectedImage) {
          formDataToSend.append('image', selectedImage);
        } else if (formData.imageUrl) {
          formDataToSend.append('imageUrl', formData.imageUrl);
        }
        
        if (editingItem) {
          await restaurantsAPI.updateWithFile(editingItem.id, formDataToSend);
          toast.success('Restoran berhasil diperbarui!');
        } else {
          await restaurantsAPI.createWithFile(formDataToSend);
          toast.success('Restoran berhasil ditambahkan!');
        }
      } else {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('nama', formData.nama);
        formDataToSend.append('deskripsi', formData.deskripsi);
        formDataToSend.append('harga', formData.harga);
        formDataToSend.append('kategori', formData.kategori);
        formDataToSend.append('isAvailable', formData.isAvailable.toString());
        if (formData.restaurantId) formDataToSend.append('restaurantId', formData.restaurantId);
        
        if (selectedImage) {
          formDataToSend.append('image', selectedImage);
        } else if (formData.imageUrl) {
          formDataToSend.append('imageUrl', formData.imageUrl);
        }
        
        if (editingItem) {
          await productsAPI.updateWithFile(editingItem.id, formDataToSend);
          toast.success('Produk berhasil diperbarui!');
        } else {
          await productsAPI.createWithFile(formDataToSend);
          toast.success('Produk berhasil ditambahkan!');
        }
      }
      
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Gagal menyimpan data. Silakan coba lagi.');
    }
  };

  const openDeleteConfirm = (type: 'restaurant' | 'product', id: number, name: string) => {
    setConfirmDialog({ isOpen: true, type, id, name });
  };

  const handleDelete = async () => {
    const { type, id } = confirmDialog;
    setDeleteLoading(true);
    
    try {
      if (type === 'restaurant') {
        await restaurantsAPI.delete(id);
        toast.success('Restoran berhasil dihapus!');
      } else {
        await productsAPI.delete(id);
        toast.success('Produk berhasil dihapus!');
      }
      setConfirmDialog({ isOpen: false, type: 'restaurant', id: 0, name: '' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Gagal menghapus data. Silakan coba lagi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductsByRestaurant = (restaurantId: number) => {
    return products.filter(p => p.restaurantId === restaurantId);
  };

  const getUnassignedProducts = () => {
    return products.filter(p => !p.restaurantId);
  };

  const filteredRestaurants = restaurants.filter(r =>
    r.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola restoran dan menu makanan</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => openModal('restaurant')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30 text-sm"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">Tambah</span> <span>Restoran</span>
          </button>
          <button
            onClick={() => openModal('product')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 text-sm"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">Tambah</span> <span>Produk</span>
          </button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg sm:rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'restaurants'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Restoran</span> ({restaurants.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Produk</span> ({products.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'restaurants' ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredRestaurants.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
              <Store className="mx-auto text-gray-300 mb-3 sm:mb-4" size={40} />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada restoran</h3>
              <p className="text-sm text-gray-500 mb-4">Mulai dengan menambahkan restoran pertama</p>
              <button
                onClick={() => openModal('restaurant')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-600 transition-colors text-sm"
              >
                <Plus size={16} />
                Tambah Restoran
              </button>
            </div>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Restaurant Header */}
                <div
                  className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedRestaurant(
                      expandedRestaurant === restaurant.id ? null : restaurant.id
                    )
                  }
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden">
                      {restaurant.imageUrl ? (
                        <img
                          src={restaurant.imageUrl}
                          alt={restaurant.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="text-gray-400" size={20} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{restaurant.nama}</h3>
                        <span
                          className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                            restaurant.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {restaurant.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{restaurant.alamat}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                        {getProductsByRestaurant(restaurant.id).length} produk
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('product', undefined, restaurant.id);
                      }}
                      className="p-1.5 sm:p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Tambah Produk"
                    >
                      <Plus size={16} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('restaurant', restaurant);
                      }}
                      className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil size={16} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm('restaurant', restaurant.id, restaurant.nama);
                      }}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="sm:w-4 sm:h-4" />
                    </button>
                    {expandedRestaurant === restaurant.id ? (
                      <ChevronDown size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                    )}
                  </div>
                </div>

                {/* Restaurant Products */}
                {expandedRestaurant === restaurant.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-3 sm:p-4">
                    {getProductsByRestaurant(restaurant.id).length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <Package className="mx-auto text-gray-300 mb-2" size={28} />
                        <p className="text-sm">Belum ada produk di restoran ini</p>
                        <button
                          onClick={() => openModal('product', undefined, restaurant.id)}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          + Tambah Produk
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {getProductsByRestaurant(restaurant.id).map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex gap-2 sm:gap-3">
                              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.nama}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="text-gray-300" size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                  {product.nama}
                                </h4>
                                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full mt-0.5 sm:mt-1">
                                  {product.kategori}
                                </span>
                                <p className="text-primary-600 font-semibold mt-0.5 sm:mt-1 text-sm sm:text-base">
                                  {formatPrice(product.harga)}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                              <button
                                onClick={() => openModal('product', product)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Pencil size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteConfirm('product', product.id, product.nama)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Unassigned Products */}
          {getUnassignedProducts().length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-3 sm:p-4 bg-yellow-50 border-b border-yellow-100">
                <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">
                  Produk Tanpa Restoran ({getUnassignedProducts().length})
                </h3>
                <p className="text-xs sm:text-sm text-yellow-600">
                  Produk-produk ini belum dikaitkan dengan restoran manapun
                </p>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {getUnassignedProducts().map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4"
                  >
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.nama}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="text-gray-300" size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{product.nama}</h4>
                        <p className="text-primary-600 font-semibold text-xs sm:text-sm">
                          {formatPrice(product.harga)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      <button
                        onClick={() => openModal('product', product)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Pencil size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm('product', product.id, product.nama)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* All Products View */
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="p-6 sm:p-12 text-center">
              <Package className="mx-auto text-gray-300 mb-3 sm:mb-4" size={40} />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada produk</h3>
              <p className="text-sm text-gray-500 mb-4">Mulai dengan menambahkan produk pertama</p>
              <button
                onClick={() => openModal('product')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-600 transition-colors text-sm"
              >
                <Plus size={16} />
                Tambah Produk
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Produk
                    </th>
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Kategori
                    </th>
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Restoran
                    </th>
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Harga
                    </th>
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.nama}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="text-gray-300" size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.nama}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate max-w-30 sm:max-w-50">
                              {product.deskripsi}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-full">
                          {product.kategori}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {product.restaurant?.nama || (
                            <span className="text-yellow-600">Tidak ada</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="font-semibold text-primary-600 text-xs sm:text-sm">
                          {formatPrice(product.harga)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                            product.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.isAvailable ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => openModal('product', product)}
                            className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Pencil size={16} className="sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm('product', product.id, product.nama)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {editingItem ? 'Edit' : 'Tambah'}{' '}
                {modalType === 'restaurant' ? 'Restoran' : 'Produk'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Common Fields */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nama *
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Deskripsi {modalType === 'product' && '*'}
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  required={modalType === 'product'}
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Gambar
                </label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imagePreview.startsWith('data:') || imagePreview.startsWith('http') ? imagePreview : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${imagePreview}`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                          setFormData({ ...formData, imageUrl: '' });
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <span className="text-xs text-gray-400">atau gunakan URL:</span>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                          setSelectedImage(null);
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Restaurant-specific Fields */}
              {modalType === 'restaurant' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Alamat *
                    </label>
                    <textarea
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-xs sm:text-sm text-gray-700">
                      Restoran aktif
                    </label>
                  </div>
                </>
              )}

              {/* Product-specific Fields */}
              {modalType === 'product' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Harga (Rp) *
                      </label>
                      <input
                        type="number"
                        value={formData.harga}
                        onChange={(e) =>
                          setFormData({ ...formData, harga: e.target.value })
                        }
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Kategori *
                      </label>
                      <select
                        value={formData.kategori}
                        onChange={(e) =>
                          setFormData({ ...formData, kategori: e.target.value })
                        }
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                        required
                      >
                        {kategoriOptions.map((kat) => (
                          <option key={kat} value={kat}>
                            {kat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Restoran
                    </label>
                    <select
                      value={formData.restaurantId}
                      onChange={(e) =>
                        setFormData({ ...formData, restaurantId: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">-- Pilih Restoran (Opsional) --</option>
                      {restaurants.map((rest) => (
                        <option key={rest.id} value={rest.id}>
                          {rest.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) =>
                        setFormData({ ...formData, isAvailable: e.target.checked })
                      }
                      className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isAvailable" className="text-xs sm:text-sm text-gray-700">
                      Produk tersedia
                    </label>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 sm:py-2.5 text-sm border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 sm:py-2.5 text-sm bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30"
                >
                  {editingItem ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'restaurant', id: 0, name: '' })}
        onConfirm={handleDelete}
        title={`Hapus ${confirmDialog.type === 'restaurant' ? 'Restoran' : 'Produk'}`}
        message={`Apakah Anda yakin ingin menghapus "${confirmDialog.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
