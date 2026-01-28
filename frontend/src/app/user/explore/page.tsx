'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Minus, ShoppingCart, Filter, ChevronDown, Star, Clock, Flame, TrendingUp, Heart, X, SlidersHorizontal } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import Image from 'next/image';

interface Product {
  id: number;
  nama: string;
  deskripsi: string;
  harga: number;
  imageUrl: string;
  kategori: string;
  rating?: number;
  sold?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type SortOption = 'relevant' | 'newest' | 'price_low' | 'price_high' | 'popular';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Makanan': '🍜',
  'Minuman': '🧃',
  'Snack': '🍿',
  'Buah': '🍎',
  'Nasi': '🍚',
  'Mie': '🍝',
  'Ayam': '🍗',
  'Seafood': '🦐',
  'Dessert': '🍰',
  'Coffee': '☕',
};

export default function ExplorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevant');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const categories = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Buah', 'Nasi', 'Mie', 'Ayam'];

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'relevant', label: 'Paling Sesuai', icon: <TrendingUp size={16} /> },
    { value: 'newest', label: 'Terbaru', icon: <Clock size={16} /> },
    { value: 'price_low', label: 'Harga: Rendah ke Tinggi', icon: <ChevronDown size={16} /> },
    { value: 'price_high', label: 'Harga: Tinggi ke Rendah', icon: <ChevronDown size={16} className="rotate-180" /> },
    { value: 'popular', label: 'Terlaris', icon: <Flame size={16} /> },
  ];

  useEffect(() => {
    logger.component.info('ExplorePage mounted');
    
    const fetchProducts = async () => {
      logger.api.debug('Fetching products');
      try {
        const data = await productsAPI.getAll();
        // Add mock data for rating and sold if not exists
        const enhancedData = data.map((p: Product) => ({
          ...p,
          rating: p.rating || (Math.random() * 2 + 3).toFixed(1),
          sold: p.sold || Math.floor(Math.random() * 500 + 50),
        }));
        setProducts(enhancedData);
        logger.api.info('Products loaded', { count: data.length });
      } catch (error) {
        logger.api.error('Error fetching products', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('titipin_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      logger.cart.debug('Cart loaded from localStorage', { itemCount: parsedCart.length });
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('titipin_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua' || product.kategori === selectedCategory;
      const matchesPrice = product.harga >= priceRange[0] && product.harga <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    switch (sortBy) {
      case 'newest':
        result = result.slice().reverse();
        break;
      case 'price_low':
        result = result.slice().sort((a, b) => a.harga - b.harga);
        break;
      case 'price_high':
        result = result.slice().sort((a, b) => b.harga - a.harga);
        break;
      case 'popular':
        result = result.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0));
        break;
      default:
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

  const addToCart = (product: Product) => {
    logger.cart.info('Adding to cart', { productId: product.id, productName: product.nama });
    const newCart = [...cart];
    const existingItem = newCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCart.push({ product, quantity: 1 });
    }
    
    setCart(newCart);
    localStorage.setItem('titipin_cart', JSON.stringify(newCart));
  };

  const updateQuantity = (productId: number, delta: number) => {
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: Math.max(0, newQuantity) };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(newCart);
    localStorage.setItem('titipin_cart', JSON.stringify(newCart));
  };

  const toggleFavorite = (productId: number) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem('titipin_favorites', JSON.stringify(newFavorites));
  };

  const getCartQuantity = (productId: number) => {
    const item = cart.find(item => item.product.id === productId);
    return item?.quantity || 0;
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = cart.reduce((sum, item) => sum + (item.product.harga * item.quantity), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
        <div className="px-4 py-3">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari makanan, minuman, snack..."
                className="w-full pl-12 pr-4 py-3 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Cart Button */}
            <Link href="/user/cart" className="relative">
              <div className="bg-white p-3 rounded-lg shadow-md">
                <ShoppingCart className="text-orange-500" size={24} />
              </div>
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category Slider */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex flex-col items-center min-w-[70px] p-2 rounded-xl transition-all ${
                  selectedCategory === category
                    ? 'bg-orange-50 border-2 border-orange-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                }`}
              >
                <span className="text-2xl mb-1">
                  {category === 'Semua' ? '🍽️' : categoryIcons[category] || '🍴'}
                </span>
                <span className={`text-xs font-medium ${
                  selectedCategory === category ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flash Sale Banner */}
      <div className="px-4 py-3">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-20">
            <Image src="/fast_food.png" alt="" width={120} height={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="text-yellow-300" size={20} />
              <span className="font-bold text-lg">Flash Sale!</span>
            </div>
            <p className="text-sm text-white/80">Diskon hingga 50% untuk menu terpilih</p>
          </div>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-white border-y border-gray-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{filteredProducts.length}</span>
          <span>produk ditemukan</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
              showFilters ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-300 text-gray-600'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Urutkan</span>
              <ChevronDown size={14} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border z-50 py-1">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors ${
                        sortBy === option.value ? 'text-orange-600 bg-orange-50' : 'text-gray-700'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <span className="ml-auto text-orange-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rentang Harga</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPriceRange([0, 10000])}
                className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-orange-100"
              >
                &lt; 10rb
              </button>
              <button
                onClick={() => setPriceRange([10000, 25000])}
                className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-orange-100"
              >
                10rb - 25rb
              </button>
              <button
                onClick={() => setPriceRange([25000, 50000])}
                className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-orange-100"
              >
                25rb - 50rb
              </button>
              <button
                onClick={() => setPriceRange([0, 100000])}
                className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-orange-100"
              >
                Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada hasil</h3>
            <p className="text-gray-500">Coba kata kunci atau filter lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => {
              const quantity = getCartQuantity(product.id);
              const isFavorite = favorites.includes(product.id);
              
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all group"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={product.imageUrl} 
                        alt={product.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        {categoryIcons[product.kategori] || '🍴'}
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(product.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all"
                    >
                      <Heart 
                        size={16} 
                        className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                      />
                    </button>

                    {/* Category Badge */}
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {product.kategori}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 min-h-[40px]">
                      {product.nama}
                    </h3>
                    
                    {/* Price */}
                    <div className="mt-2">
                      <span className="text-orange-600 font-bold text-base">
                        {formatPrice(product.harga)}
                      </span>
                    </div>

                    {/* Rating & Sold */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-0.5">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span>{product.rating}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span>{product.sold}+ terjual</span>
                    </div>

                    {/* Add to Cart */}
                    <div className="mt-3">
                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus size={16} />
                          Tambah
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-orange-50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="p-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-semibold text-orange-600">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="p-1.5 bg-orange-500 text-white rounded-md shadow-sm hover:bg-orange-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Link href="/user/cart">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 shadow-2xl flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <p className="font-bold">{totalCartItems} item</p>
                  <p className="text-sm text-white/80">{formatPrice(totalCartValue)}</p>
                </div>
              </div>
              <div className="bg-white text-orange-600 px-6 py-2 rounded-xl font-bold">
                Checkout
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
