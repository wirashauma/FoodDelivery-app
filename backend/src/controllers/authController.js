// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
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
    process.env.JWT_SECRET || 'supersecretjwtkey',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Fungsi untuk Register
exports.register = async (req, res) => {
  try {
    // <-- MODIFIKASI: Ambil 'role' dari body
    const { email, password, role } = req.body;

    // <-- TAMBAHAN: Validasi input dasar
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, dan role dibutuhkan' });
    }

    // <-- TAMBAHAN: Validasi role (termasuk ADMIN)
    const validRoles = ['USER', 'DELIVERER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid. Gunakan USER, DELIVERER, atau ADMIN' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email sudah digunakan!' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await prisma.user.create({
      data: {
        email: email,
        passwordHash: hashed,
        role: role, // <-- MODIFIKASI: Simpan role ke database
      },
      select: {
        id: true,
        email: true,
        role: true, // <-- MODIFIKASI: Kembalikan role di response
      },
    });

    res.status(201).json({
      status: 'sukses',
      message: 'User berhasil dibuat!',
      data: result,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email sudah digunakan!' });
    }
    console.error(error);
    res.status(500).json({ error: 'Gagal register user' });
  }
};

// Fungsi untuk Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Email atau password salah' });

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
      message: 'Login berhasil!',
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
    console.error(error);
    res.status(500).json({ error: 'Gagal login' });
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