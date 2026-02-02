// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { config } = require('../lib/config');
const prisma = new PrismaClient();

// Token configuration
const ACCESS_TOKEN_EXPIRY = config.jwt.accessTokenExpiry;
const REFRESH_TOKEN_EXPIRY = config.jwt.refreshTokenExpiry;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// Helper function to generate tokens
const generateAccessToken = (user, platform = 'web') => {
  const payload = {
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    platform: platform,
    type: 'access',
  };
  
  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Valid roles sesuai dengan Prisma enum Role
const VALID_ROLES = ['CUSTOMER', 'DELIVERER', 'MERCHANT', 'ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE'];

// Public roles yang bisa dipilih saat registrasi (tanpa admin roles)
const PUBLIC_REGISTRATION_ROLES = ['CUSTOMER', 'DELIVERER', 'MERCHANT'];

// Helper validasi email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper validasi password strength
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push('Minimal 8 karakter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Minimal 1 huruf besar');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Minimal 1 huruf kecil');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Minimal 1 angka');
  }
  return errors;
};

// Fungsi untuk Register
exports.register = async (req, res) => {
  try {
    const { email, password, role, fullName, phone } = req.body;

    // Validasi: Field wajib tidak boleh kosong
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        error: 'email_required',
        message: 'Alamat email wajib diisi',
        fields: { email: 'Masukkan alamat email Anda' }
      });
    }

    if (!password) {
      return res.status(400).json({ 
        error: 'password_required',
        message: 'Password wajib diisi',
        fields: { password: 'Masukkan password Anda' }
      });
    }

    // Validasi: Format email
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ 
        error: 'invalid_email',
        message: 'Format email tidak valid',
        fields: { email: 'Masukkan alamat email yang valid' }
      });
    }

    // Validasi: Panjang email
    if (email.length > 255) {
      return res.status(400).json({ 
        error: 'email_too_long',
        message: 'Email terlalu panjang',
        fields: { email: 'Email maksimal 255 karakter' }
      });
    }

    // Validasi: Kekuatan password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        error: 'weak_password',
        message: 'Password belum memenuhi persyaratan keamanan',
        fields: { password: passwordErrors }
      });
    }

    // Validasi: Role - default ke CUSTOMER jika tidak diberikan atau kosong
    let userRole = 'CUSTOMER'; // Default role
    if (role && role.trim()) {
      const normalizedRole = role.trim().toUpperCase();
      
      // SECURITY: Only allow public registration roles
      // Admin roles must be created by existing admins
      if (!PUBLIC_REGISTRATION_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ 
          error: 'invalid_role',
          message: 'Tipe akun tidak valid untuk registrasi publik',
          fields: { role: 'Pilih: Customer, Deliverer, atau Merchant' }
        });
      }
      userRole = normalizedRole;
    }

    // Validasi: Nomor telepon (jika diberikan)
    if (phone && phone.trim()) {
      const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return res.status(400).json({ 
          error: 'invalid_phone',
          message: 'Format nomor telepon tidak valid',
          fields: { phone: 'Masukkan nomor telepon yang valid (contoh: 08123456789)' }
        });
      }
    }

    // Cek apakah email sudah digunakan
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'email_exists',
        message: 'Email ini sudah terdaftar',
        fields: { email: 'Gunakan email lain atau masuk ke akun Anda' }
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash: hashed,
        role: userRole,
        fullName: fullName ? fullName.trim() : null,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Akun berhasil dibuat',
      data: result,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'email_exists',
        message: 'Email ini sudah terdaftar',
        fields: { email: 'Gunakan email lain atau masuk ke akun Anda' }
      });
    }
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Terjadi kesalahan. Silakan coba beberapa saat lagi.' 
    });
  }
};

// Fungsi untuk Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi: Email wajib diisi
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        error: 'email_required',
        message: 'Masukkan alamat email Anda',
        fields: { email: 'Email wajib diisi' }
      });
    }

    // Validasi: Password wajib diisi
    if (!password) {
      return res.status(400).json({ 
        error: 'password_required',
        message: 'Masukkan password Anda',
        fields: { password: 'Password wajib diisi' }
      });
    }

    // Validasi: Format email
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ 
        error: 'invalid_email',
        message: 'Format email tidak valid',
        fields: { email: 'Masukkan alamat email yang valid' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'invalid_credentials',
        message: 'Email atau password tidak sesuai',
        fields: { _form: 'Periksa kembali email dan password Anda' }
      });
    }

    // Cek apakah akun dinonaktifkan/suspended
    if (user.isActive === false) {
      return res.status(403).json({ 
        error: 'account_disabled',
        message: 'Akun Anda tidak aktif',
        fields: { _form: 'Hubungi customer service untuk bantuan' }
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ 
        error: 'invalid_credentials',
        message: 'Email atau password tidak sesuai',
        fields: { _form: 'Periksa kembali email dan password Anda' }
      });
    }

    const platform = req.platform || 'web';
    const deviceInfo = req.headers['user-agent'] || 'unknown';

    // Generate tokens
    const accessToken = generateAccessToken(user, platform);
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        deviceInfo: deviceInfo.substring(0, 255),
      },
    });

    res.json({
      status: 'success',
      message: 'Login berhasil',
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nama: user.fullName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Terjadi kesalahan. Silakan coba beberapa saat lagi.'
    });
  }
};

// Fungsi untuk Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token diperlukan' });
    }

    // Find the refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token tidak valid' });
    }

    // Check if token is revoked
    if (storedToken.revoked) {
      return res.status(401).json({ error: 'Refresh token telah dicabut' });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      return res.status(401).json({ error: 'Refresh token sudah expired' });
    }

    const user = storedToken.user;
    const platform = req.platform || 'web';
    const deviceInfo = req.headers['user-agent'] || 'unknown';

    // Generate new tokens
    const newAccessToken = generateAccessToken(user, platform);
    const newRefreshToken = generateRefreshToken();

    // Revoke old token and create new one (token rotation)
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
          deviceInfo: deviceInfo.substring(0, 255),
        },
      }),
    ]);

    res.json({
      message: 'Token berhasil diperbarui',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Gagal refresh token' });
  }
};

// Fungsi untuk Logout (revoke refresh token)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Gagal logout' });
  }
};

// Fungsi untuk Logout dari semua device
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: userId },
      data: { revoked: true },
    });

    res.json({ message: 'Logout dari semua device berhasil' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Gagal logout' });
  }
};

// Fungsi untuk mendapatkan sessions aktif
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId: userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Gagal mengambil sessions' });
  }
};

// Fungsi untuk Forgot Password - Request Reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email dibutuhkan' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'Jika email terdaftar, link reset password akan dikirim' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    // In production, send email with resetToken
    // For now, return token (REMOVE IN PRODUCTION)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ 
      message: 'Jika email terdaftar, link reset password akan dikirim',
      // DEVELOPMENT ONLY - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Gagal memproses request' });
  }
};

// Fungsi untuk Reset Password dengan Token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token dan password baru dibutuhkan' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token tidak valid atau sudah expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { revoked: true },
      }),
    ]);

    res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Gagal reset password' });
  }
};

// Fungsi untuk Change Password (authenticated)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan baru dibutuhkan' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Password lama salah' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Gagal mengubah password' });
  }
};