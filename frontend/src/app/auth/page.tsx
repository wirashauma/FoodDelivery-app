'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Truck, Zap } from 'lucide-react';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';
import { logger } from '@/lib/logger';
import Image from 'next/image';

type Role = 'CUSTOMER' | 'DELIVERER';

// Quick login credentials for testing
const QUICK_LOGIN_ACCOUNTS = [
  { email: 'wira@gmail.com', password: 'Wira1234', role: 'CUSTOMER', label: 'Customer', icon: User, color: 'from-primary-500 to-primary-700' },
  { email: 'shauma@gmail.com', password: 'Wira1234', role: 'DELIVERER', label: 'Deliverer', icon: Truck, color: 'from-blue-500 to-indigo-600' },
  { email: 'admin@gmail.com', password: 'Wira1234', role: 'ADMIN', label: 'Admin', icon: Zap, color: 'from-purple-500 to-violet-600' },
];

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    logger.auth.debug('Calling login API', { email: loginEmail });
    const response = await authAPI.login(loginEmail, loginPassword);
    logger.auth.info('Login successful', { 
      userId: response.user.id, 
      role: response.user.role,
      expiresIn: response.expiresIn 
    });
    
    const userRole = response.user.role;
    const accessTokenExpiry = response.expiresIn ? response.expiresIn / 86400 : 1/96;
    
    Cookies.set('authToken', response.accessToken, { expires: accessTokenExpiry });
    Cookies.set('refreshToken', response.refreshToken, { expires: 7 });
    Cookies.set('userRole', userRole, { expires: 7 });
    Cookies.set('userId', response.user.id.toString(), { expires: 7 });
    
    logger.navigation.info(`Redirecting to ${userRole} dashboard`);
    switch (userRole) {
      case 'ADMIN':
        router.push('/dashboard');
        break;
      case 'DELIVERER':
        router.push('/deliverer/dashboard');
        break;
      case 'CUSTOMER':
      default:
        router.push('/user/dashboard');
        break;
    }
  };

  const handleQuickLogin = async (account: typeof QUICK_LOGIN_ACCOUNTS[0]) => {
    setQuickLoginLoading(account.email);
    setError('');
    logger.auth.info('Quick login attempt', { email: account.email, role: account.role });
    
    try {
      await handleLogin(account.email, account.password);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Login gagal. Pastikan akun sudah terdaftar.';
      logger.auth.error('Quick login failed', { email: account.email, error: errorMsg });
      setError(errorMsg);
    } finally {
      setQuickLoginLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    logger.auth.info(`Auth attempt: ${isSignUp ? 'Register' : 'Login'}`, { 
      email, 
      role: isSignUp ? selectedRole : undefined 
    });

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          logger.auth.warn('Password mismatch during registration');
          setError('Password tidak cocok!');
          setLoading(false);
          return;
        }
        
        if (password.length < 8) {
          setError('Password minimal 8 karakter!');
          setLoading(false);
          return;
        }
        
        logger.auth.debug('Calling register API', { email, role: selectedRole });
        await authAPI.register(email, password, selectedRole);
        logger.auth.info('Registration successful', { email, role: selectedRole });
        
        setIsSignUp(false);
        setError('');
        setPassword('');
        setConfirmPassword('');
        alert('Registrasi berhasil! Silakan login.');
      } else {
        await handleLogin(email, password);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.';
      logger.auth.error(`Auth failed: ${isSignUp ? 'Register' : 'Login'}`, { 
        email, 
        error: errorMsg,
        fullError: error 
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    logger.auth.debug(`Switched to ${!isSignUp ? 'Register' : 'Login'} mode`);
  };

  const roles: { value: Role; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'CUSTOMER', label: 'Customer', icon: <User size={20} />, description: 'Pesan makanan favorit' },
    { value: 'DELIVERER', label: 'Deliverer', icon: <Truck size={20} />, description: 'Antar & dapatkan uang' },
  ];

  return (
    <div className="min-h-screen flex bg-linear-to-br from-orange-50 via-white to-red-50">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-linear-to-br from-orange-500 via-red-500 to-pink-500">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute bottom-40 right-10 w-20 h-20 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <Image 
              src="/logo.png" 
              alt="TitipIn Logo" 
              width={120} 
              height={120}
              className="drop-shadow-2xl"
            />
          </div>
          
          {/* Main Illustration */}
          <div className="relative mb-8">
            <Image 
              src={isSignUp ? "/signup_image.png" : "/signin_image.png"}
              alt="Food Delivery"
              width={350}
              height={350}
              className="drop-shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/fast_food.png';
              }}
            />
          </div>
          
          {/* Text */}
          <h1 className="text-4xl font-bold mb-4 text-center">
            {isSignUp ? 'Bergabung Sekarang!' : 'Selamat Datang!'}
          </h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            {isSignUp 
              ? 'Daftar dan nikmati kemudahan pesan antar makanan di kampusmu'
              : 'Pesan makanan favorit dari kantin kampus dengan mudah dan cepat'
            }
          </p>
          
          {/* Food icons decoration */}
          <div className="flex gap-4 mt-8">
            <Image src="/fast_food.png" alt="Fast Food" width={60} height={60} className="opacity-80 hover:opacity-100 transition-opacity" />
            <Image src="/salad.png" alt="Salad" width={60} height={60} className="opacity-80 hover:opacity-100 transition-opacity" />
            <Image src="/fruit.png" alt="Fruit" width={60} height={60} className="opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo.png" alt="TitipIn" width={80} height={80} />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isSignUp ? 'Buat Akun Baru' : 'Masuk ke Akun'}
            </h2>
            <p className="text-gray-500">
              {isSignUp 
                ? 'Isi data diri untuk mulai memesan'
                : 'Masukkan email dan password'
              }
            </p>
          </div>

          {/* Quick Login Buttons - DEVELOPMENT ONLY */}
          {!isSignUp && process.env.NODE_ENV === 'development' && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 text-center mb-3">Login Cepat (Development Only)</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_LOGIN_ACCOUNTS.map((account) => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleQuickLogin(account)}
                      disabled={quickLoginLoading !== null}
                      className={`p-3 rounded-xl bg-linear-to-r ${account.color} text-white hover:opacity-90 transition-all disabled:opacity-50 flex flex-col items-center gap-1 shadow-lg`}
                    >
                      {quickLoginLoading === account.email ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Icon size={20} />
                      )}
                      <span className="text-xs font-medium">{account.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          {!isSignUp && process.env.NODE_ENV === 'development' && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400">atau</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection - Only for Sign Up (without ADMIN) */}
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Daftar sebagai</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedRole === role.value
                          ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg shadow-orange-500/20'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-full ${selectedRole === role.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {role.icon}
                        </div>
                        <span className="font-semibold">{role.label}</span>
                        <span className="text-xs text-gray-500">{role.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password - Only for Sign In */}
            {!isSignUp && (
              <div className="text-right">
                <button type="button" className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  Lupa Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : isSignUp ? (
                'Daftar Sekarang'
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-gray-500">
              {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
              <button
                onClick={toggleMode}
                className="ml-2 text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                {isSignUp ? 'Masuk' : 'Daftar'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Dengan masuk atau daftar, kamu menyetujui</p>
            <p>
              <button className="text-orange-500 hover:underline">Syarat & Ketentuan</button>
              {' dan '}
              <button className="text-orange-500 hover:underline">Kebijakan Privasi</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
