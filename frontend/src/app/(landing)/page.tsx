'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Truck,
  Clock,
  Shield,
  Star,
  Users,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// Header Component
function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isScrolled ? '#E53935' : '#ffffff' }}
            >
              <span 
                className="text-xl font-bold"
                style={{ color: isScrolled ? '#ffffff' : '#E53935' }}
              >T</span>
            </div>
            <span className={`text-xl font-bold ${
              isScrolled ? 'text-gray-800' : 'text-white'
            }`}>Titipin</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {['Home', 'Features', 'About', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`font-medium transition-colors ${
                  isScrolled ? 'text-gray-600 hover:text-red-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Login Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/auth"
              className="px-6 py-2.5 rounded-full font-medium transition-all"
              style={{ 
                backgroundColor: isScrolled ? '#E53935' : '#ffffff',
                color: isScrolled ? '#ffffff' : '#E53935'
              }}
            >
              Login Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg ${
              isScrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="lg:hidden bg-white border-t shadow-lg"
        >
          <div className="px-4 py-6 space-y-4">
            {['Home', 'Features', 'About', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block py-2 text-gray-600 font-medium hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <Link
              href="/auth"
              className="block w-full text-center py-3 text-white rounded-full font-medium"
              style={{ backgroundColor: '#E53935' }}
            >
              Login Admin
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background - Using inline style for gradient */}
      <div 
        className="absolute inset-0" 
        style={{ background: 'linear-gradient(135deg, #E53935 0%, #ef5350 50%, #d32f2f 100%)' }}
      />
      
      {/* Animated circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute -bottom-40 -left-40 w-125 h-125 bg-white/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-white"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-block px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-6"
            >
              ✨ Platform Delivery Terpercaya
            </motion.span>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Pesan Makanan
              <br />
              <span className="text-white/90 border-b-4 border-white pb-1">Lebih Mudah</span>
              <br />
              & Cepat
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-white/80 mb-8 max-w-lg"
            >
              Titipin menghubungkan Anda dengan restoran favorit dan kurir terpercaya. 
              Nikmati kemudahan pesan antar makanan kapan saja, di mana saja.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Pelajari Lebih Lanjut
                <ChevronRight size={20} />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                Hubungi Kami
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="flex gap-8 mt-12 pt-8 border-t border-white/20"
            >
              {[
                { value: '10K+', label: 'Happy Customers' },
                { value: '500+', label: 'Partner Restaurants' },
                { value: '1K+', label: 'Active Drivers' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
            className="hidden lg:block relative"
          >
            <div className="relative">
              {/* Phone mockup */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-72 h-125 bg-gray-900 rounded-[3rem] p-3 mx-auto shadow-2xl"
              >
                <div className="w-full h-full bg-linear-to-b from-primary-50 to-white rounded-[2.5rem] overflow-hidden relative">
                  {/* App Screen */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Good Morning 👋</p>
                        <p className="font-bold text-gray-800">Ahmad</p>
                      </div>
                      <div className="w-10 h-10 bg-primary-100 rounded-full" />
                    </div>
                    <div className="bg-gray-100 rounded-xl p-3 mb-4">
                      <p className="text-sm text-gray-500">🔍 Search food...</p>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex gap-3">
                          <div className="w-16 h-16 bg-primary-100 rounded-lg" />
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-gray-100 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-primary-200 rounded w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, 10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -left-16 top-20 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Truck className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Order Delivered!</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                className="absolute -right-8 bottom-32 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} className="text-primary-500 fill-primary-500" />
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-1">Excellent Service!</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Truck,
      title: 'Pengiriman Cepat',
      description: 'Kurir kami siap mengantarkan pesanan Anda dalam waktu singkat dengan aman.',
      bgColor: '#E53935',
    },
    {
      icon: Clock,
      title: 'Layanan 24/7',
      description: 'Pesan kapan saja, kami selalu siap melayani kebutuhan Anda.',
      bgColor: '#d32f2f',
    },
    {
      icon: Shield,
      title: 'Pembayaran Aman',
      description: 'Transaksi yang aman dan terjamin dengan berbagai metode pembayaran.',
      bgColor: '#c62828',
    },
    {
      icon: Star,
      title: 'Rating & Review',
      description: 'Lihat ulasan dari pelanggan lain untuk memilih restoran terbaik.',
      bgColor: '#E53935',
    },
    {
      icon: MapPin,
      title: 'Tracking Real-time',
      description: 'Pantau lokasi kurir dan estimasi waktu kedatangan secara real-time.',
      bgColor: '#d32f2f',
    },
    {
      icon: Users,
      title: 'Kurir Terverifikasi',
      description: 'Semua kurir kami telah melalui proses verifikasi dan pelatihan.',
      bgColor: '#c62828',
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span 
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-4 border"
            style={{ backgroundColor: '#ffebee', color: '#E53935', borderColor: '#ffcdd2' }}
          >
            Fitur Unggulan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Mengapa Memilih <span style={{ color: '#E53935' }}>Titipin</span>?
          </h2>
          <p className="text-gray-500 text-lg">
            Kami menyediakan layanan terbaik untuk memenuhi kebutuhan pengiriman makanan Anda
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={scaleIn}
              whileHover={{ y: -10 }}
              className="group p-8 rounded-2xl bg-white hover:shadow-2xl transition-all duration-300 border border-gray-100"
              style={{ '--tw-shadow-color': 'rgba(229, 57, 53, 0.1)' } as React.CSSProperties}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: feature.bgColor, boxShadow: '0 10px 30px rgba(229, 57, 53, 0.2)' }}
              >
                <feature.icon className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// About Section
function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative"
          >
            <div className="relative">
              <div 
                className="w-full h-125 rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #ef5350 0%, #E53935 100%)' }}
              >
                <div className="absolute inset-0 bg-[url('/food-pattern.svg')] opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="w-64 h-64 border-4 border-dashed border-white/30 rounded-full flex items-center justify-center"
                  >
                    <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center">
                      <Truck size={64} className="text-white" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Stats card */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="absolute -bottom-8 -right-8 bg-white rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#ffebee' }}
                  >
                    <Users style={{ color: '#E53935' }} size={32} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">10K+</p>
                    <p className="text-gray-500">Pengguna Aktif</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.span
              variants={fadeInUp}
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-4 border"
              style={{ backgroundColor: '#ffebee', color: '#E53935', borderColor: '#ffcdd2' }}
            >
              Tentang Kami
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
            >
              Platform Delivery <span style={{ color: '#E53935' }}>Terpercaya</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-500 text-lg mb-6 leading-relaxed"
            >
              Titipin hadir sebagai solusi pengiriman makanan yang menghubungkan pelanggan 
              dengan restoran favorit melalui jaringan kurir terpercaya kami.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-gray-500 mb-8 leading-relaxed"
            >
              Dengan teknologi terdepan dan komitmen terhadap kualitas layanan, kami memastikan 
              setiap pesanan sampai dengan aman dan tepat waktu. Bergabunglah dengan ribuan 
              pengguna yang telah mempercayakan kebutuhan pengiriman mereka kepada kami.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { value: '99%', label: 'Tingkat Kepuasan' },
                { value: '15min', label: 'Rata-rata Pengiriman' },
                { value: '500+', label: 'Partner Restoran' },
                { value: '24/7', label: 'Customer Support' },
              ].map((stat) => (
                <div 
                  key={stat.label} 
                  className="p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-colors cursor-pointer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ffcdd2';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 235, 238, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#f3f4f6';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#E53935' }}>{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section 
      className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #E53935 0%, #ef5350 50%, #d32f2f 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Siap Bergabung dengan Titipin?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Download aplikasi sekarang dan nikmati kemudahan pesan antar makanan dengan layanan terbaik.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-primary-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              App Store
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              Play Store
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection() {
  return (
    <section id="contact" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.span
              variants={fadeInUp}
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-4 border"
              style={{ backgroundColor: '#ffebee', color: '#E53935', borderColor: '#ffcdd2' }}
            >
              Hubungi Kami
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
            >
              Ada Pertanyaan? <span style={{ color: '#E53935' }}>Kami Siap Membantu</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-500 text-lg mb-8 leading-relaxed"
            >
              Tim kami siap menjawab pertanyaan dan membantu Anda dengan layanan terbaik.
            </motion.p>

            <motion.div variants={fadeInUp} className="space-y-6">
              {[
                { icon: MapPin, label: 'Alamat', value: 'Jl. Contoh No. 123, Jakarta, Indonesia' },
                { icon: Phone, label: 'Telepon', value: '+62 812-3456-7890' },
                { icon: Mail, label: 'Email', value: 'hello@titipin.com' },
              ].map((contact) => (
                <div 
                  key={contact.label} 
                  className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 transition-all cursor-pointer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ffcdd2';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(229, 57, 53, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#f3f4f6';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#ffebee' }}
                  >
                    <contact.icon style={{ color: '#E53935' }} size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{contact.label}</p>
                    <p className="text-gray-500">{contact.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Social Links */}
            <motion.div variants={fadeInUp} className="flex gap-4 mt-8">
              {[Facebook, Instagram, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E53935';
                    e.currentTarget.style.borderColor = '#E53935';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <Icon size={20} />
                </a>
              ))}
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <form className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
                    <input
                      type="text"
                      placeholder="Nama lengkap"
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl transition-colors bg-gray-50"
                      style={{ outline: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#E53935';
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(229, 57, 53, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl transition-colors bg-gray-50"
                      style={{ outline: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#E53935';
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(229, 57, 53, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subjek</label>
                  <input
                    type="text"
                    placeholder="Subjek pesan"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl transition-colors bg-gray-50"
                    style={{ outline: 'none' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#E53935';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(229, 57, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pesan</label>
                  <textarea
                    rows={5}
                    placeholder="Tulis pesan Anda..."
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl transition-colors resize-none bg-gray-50"
                    style={{ outline: 'none' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#E53935';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(229, 57, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 text-white rounded-xl font-semibold transition-colors"
                  style={{ backgroundColor: '#E53935', boxShadow: '0 10px 40px rgba(229, 57, 53, 0.3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d32f2f'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E53935'; }}
                >
                  Kirim Pesan
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#E53935', boxShadow: '0 10px 30px rgba(229, 57, 53, 0.3)' }}
              >
                <span className="text-xl font-bold text-white">T</span>
              </div>
              <span className="text-2xl font-bold">Titipin</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Platform pengiriman makanan terpercaya yang menghubungkan pelanggan dengan restoran favorit.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4 text-gray-400">
              {['Home', 'Features', 'About', 'Contact'].map((link) => (
                <li key={link}>
                  <a 
                    href={`#${link.toLowerCase()}`} 
                    className="transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef5350'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-gray-400">
              {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef5350'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Newsletter</h4>
            <p className="text-gray-400 mb-4">Dapatkan update terbaru dari kami.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm"
                style={{ outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = '#E53935'; }}
                onBlur={(e) => { e.target.style.borderColor = '#374151'; }}
              />
              <button 
                className="px-5 py-3 rounded-xl transition-colors font-medium text-sm text-white"
                style={{ backgroundColor: '#E53935' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d32f2f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E53935'; }}
              >
                Kirim
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: 'linear-gradient(to right, transparent, #374151, transparent)' }} />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Titipin. All rights reserved.
          </p>
          <div className="flex gap-3">
            {[Facebook, Instagram, Twitter].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 transition-all"
                onMouseEnter={(e) => { 
                  e.currentTarget.style.backgroundColor = '#E53935'; 
                  e.currentTarget.style.color = '#ffffff'; 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.backgroundColor = '#1f2937'; 
                  e.currentTarget.style.color = '#9ca3af'; 
                }}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </main>
  );
}
