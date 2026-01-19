// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk Register
exports.register = async (req, res) => {
  try {
    // <-- MODIFIKASI: Ambil 'role' dari body
    const { email, password, role } = req.body;

    // <-- TAMBAHAN: Validasi input dasar
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, dan role dibutuhkan' });
    }

    // <-- TAMBAHAN: Validasi role
    if (role !== 'USER' && role !== 'DELIVERER') {
      return res.status(400).json({ error: 'Role tidak valid. Gunakan USER atau DELIVERER' });
    }

    const existing = await prisma.users.findUnique({
      where: { email: email },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email sudah digunakan!' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await prisma.users.create({
      data: {
        email: email,
        password_hash: hashed,
        role: role, // <-- MODIFIKASI: Simpan role ke database
      },
      select: {
        user_id: true,
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

    const user = await prisma.users.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Email atau password salah' });

    // <-- MODIFIKASI: Payload disesuaikan untuk AuthGate di Flutter
    // Ini akan membuat token berisi: { "user": { "id": 123, "role": "USER" }, "platform": "mobile", "iat": ..., "exp": ... }
    // [ENHANCEMENT] Include platform information in token
    const payload = {
      user: {
        id: user.user_id, // Gunakan user_id dari database
        role: user.role, // Masukkan role
        email: user.email, // Add email to token
      },
      platform: req.platform || 'mobile', // Include platform (default mobile for safety)
    };
    
    // Logika signing token Anda sudah benar, kita hanya mengganti payload-nya
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil!',
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal login' });
  }
};