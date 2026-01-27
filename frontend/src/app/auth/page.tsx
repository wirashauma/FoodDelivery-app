'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Truck, Shield } from 'lucide-react';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';
import { logger } from '@/lib/logger';

type Role = 'USER' | 'DELIVERER' | 'ADMIN';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        // Register
        if (password !== confirmPassword) {
          logger.auth.warn('Password mismatch during registration');
          setError('Password tidak cocok!');
          setLoading(false);
          return;
        }
        
        logger.auth.debug('Calling register API', { email, role: selectedRole });
        await authAPI.register(email, password, selectedRole);
        logger.auth.info('Registration successful', { email, role: selectedRole });
        
        // After registration, switch to sign in
        setIsSignUp(false);
        setError('');
        alert('Registrasi berhasil! Silakan login.');
      } else {
        // Login
        logger.auth.debug('Calling login API', { email });
        const response = await authAPI.login(email, password);
        logger.auth.info('Login successful', { 
          userId: response.user.id, 
          role: response.user.role,
          expiresIn: response.expiresIn 
        });
        
        const userRole = response.user.role;
        
        // Calculate token expiry from expiresIn (seconds)
        const accessTokenExpiry = response.expiresIn ? response.expiresIn / 86400 : 1/96; // Default 15 min
        
        // Store tokens and user data
        Cookies.set('authToken', response.accessToken, { expires: accessTokenExpiry });
        Cookies.set('refreshToken', response.refreshToken, { expires: 7 }); // 7 days
        Cookies.set('userRole', userRole, { expires: 7 });
        Cookies.set('userId', response.user.id.toString(), { expires: 7 });
        
        logger.auth.debug('Tokens stored in cookies', { 
          hasAccessToken: !!response.accessToken,
          hasRefreshToken: !!response.refreshToken,
          role: userRole
        });
        
        // Redirect based on role
        logger.navigation.info(`Redirecting to ${userRole} dashboard`);
        switch (userRole) {
          case 'ADMIN':
            router.push('/dashboard');
            break;
          case 'DELIVERER':
            router.push('/deliverer/dashboard');
            break;
          case 'USER':
          default:
            router.push('/user/dashboard');
            break;
        }
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
    { value: 'USER', label: 'Customer', icon: <User size={20} />, description: 'Pesan makanan' },
    { value: 'DELIVERER', label: 'Deliverer', icon: <Truck size={20} />, description: 'Antar pesanan' },
    { value: 'ADMIN', label: 'Admin', icon: <Shield size={20} />, description: 'Kelola sistem' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="relative w-full max-w-4xl h-150 bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        
        {/* Left Panel - Forms */}
        <div className={`w-1/2 p-10 transition-all duration-500 ${isSignUp ? 'order-2' : 'order-1'}`}>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          
          {isSignUp && (
            <div className="flex justify-center gap-3 my-4">
              {/* Social icons placeholder */}
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">G</span>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">f</span>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">in</span>
              </button>
            </div>
          )}

          {!isSignUp && (
            <div className="flex justify-center gap-3 my-4">
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">G</span>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">f</span>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold">in</span>
              </button>
            </div>
          )}

          <p className="text-gray-500 text-sm text-center mb-6">
            {isSignUp ? 'or use your email for registration' : 'or use your email password'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection - Only for Sign Up */}
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Daftar sebagai</label>
                <div className="flex gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                        selectedRole === role.value
                          ? 'border-red-500 bg-red-50 text-red-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {role.icon}
                        <span className="text-xs font-medium">{role.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password - Only for Sign Up */}
            {isSignUp && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi Password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>
            )}

            {/* Forgot Password - Only for Sign In */}
            {!isSignUp && (
              <div className="text-right">
                <button type="button" className="text-sm text-gray-500 hover:text-red-500 transition-colors">
                  Forget Your Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : isSignUp ? (
                'SIGN UP'
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>
        </div>

        {/* Right Panel - Welcome/Info */}
        <div 
          className={`w-1/2 relative flex items-center justify-center transition-all duration-500 ${isSignUp ? 'order-1' : 'order-2'}`}
          style={{
            background: 'linear-gradient(135deg, #E53935 0%, #C62828 50%, #B71C1C 100%)',
            borderRadius: isSignUp ? '0 150px 0 100px' : '150px 0 100px 0',
          }}
        >
          <div className="text-center text-white px-10">
            <h2 className="text-3xl font-bold mb-4">
              {isSignUp ? 'Welcome Back!' : 'Hello, Friend!'}
            </h2>
            <p className="text-white/80 mb-8 leading-relaxed">
              {isSignUp
                ? 'Enter your personal details to use all of site features'
                : 'Register with your personal details to use all of site features'}
            </p>
            <button
              onClick={toggleMode}
              className="px-12 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-red-500 transition-all"
            >
              {isSignUp ? 'SIGN IN' : 'SIGN UP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
