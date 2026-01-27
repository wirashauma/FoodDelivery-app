'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface Product {
  id: number;
  nama: string;
  deskripsi: string;
  harga: number;
  imageUrl: string;
  kategori: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ExplorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);

  const categories = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Buah'];

  useEffect(() => {
    logger.component.info('ExplorePage mounted');
    
    const fetchProducts = async () => {
      logger.api.debug('Fetching products');
      try {
        const data = await productsAPI.getAll();
        setProducts(data);
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
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    logger.cart.info('Adding to cart', { productId: product.id, productName: product.nama });
    const newCart = [...cart];
    const existingItem = newCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
      logger.cart.debug('Increased quantity', { productId: product.id, newQuantity: existingItem.quantity });
    } else {
      newCart.push({ product, quantity: 1 });
      logger.cart.debug('New item added', { productId: product.id });
    }
    
    setCart(newCart);
    localStorage.setItem('titipin_cart', JSON.stringify(newCart));
  };

  const updateQuantity = (productId: number, delta: number) => {
    logger.cart.debug('Updating quantity', { productId, delta });
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

  const getCartQuantity = (productId: number) => {
    const item = cart.find(item => item.product.id === productId);
    return item?.quantity || 0;
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jelajahi Menu</h1>
          <p className="text-gray-500">Temukan makanan favoritmu</p>
        </div>
        
        <Link href="/user/cart" className="relative">
          <div className="bg-red-500 p-3 rounded-xl">
            <ShoppingCart className="text-white" size={24} />
          </div>
          {totalCartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {totalCartItems}
            </span>
          )}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari makanan..."
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => {
          const quantity = getCartQuantity(product.id);
          
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-40 bg-gray-100 relative">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={product.imageUrl} 
                    alt={product.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {product.kategori}
                </span>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{product.nama}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.deskripsi}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-red-500 font-bold">{formatPrice(product.harga)}</span>
                  
                  {quantity === 0 ? (
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada produk ditemukan</p>
        </div>
      )}
    </div>
  );
}
