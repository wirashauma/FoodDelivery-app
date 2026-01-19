// backend/src/controllers/profileController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dipanggil oleh: GET /api/profile/me
exports.getProfile = async (req, res) => {
  try {
    // [MODIFIKASI]
    // 1. req.user.id sekarang sudah benar (berisi user_id)
    // 2. Query 'where' diubah dari 'id' menjadi 'user_id' (sesuai schema.prisma)
    const userProfile = await prisma.users.findUnique({
      where: { user_id: req.user.id }, // <-- PERUBAHAN DI SINI
      
      // [MODIFIKASI]: 'select' diubah dari 'id' menjadi 'user_id'
      select: {
        user_id: true, // <-- PERUBAHAN DI SINI
        email: true,
        role: true,
        nama: true,
        tgl_lahir: true,
        no_hp: true,
        alamat: true,
        foto_profil: true,
      },
    });

    if (!userProfile) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Dipanggil oleh: POST /api/profile/me
exports.updateProfile = async (req, res) => {
  try {
    // Ambil data profil dari body (Ini sudah benar)
    const { nama, tgl_lahir, no_hp, alamat, foto_profil } = req.body;

    // [MODIFIKASI]
    // 1. req.user.id sekarang sudah benar
    // 2. Query 'where' diubah dari 'id' menjadi 'user_id'
    const updatedProfile = await prisma.users.update({
      where: { user_id: req.user.id }, // <-- PERUBAHAN DI SINI
      data: {
        nama,
        tgl_lahir: tgl_lahir ? new Date(tgl_lahir) : null, // Konversi ini sudah benar
        no_hp,
        alamat,
        foto_profil,
      },
    });
    
    // [MODIFIKASI]: Ganti 'password' menjadi 'password_hash' (sesuai schema.prisma)
    const { password_hash, ...profileData } = updatedProfile;
    res.json({ msg: 'Profil berhasil diperbarui', profile: profileData });

  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};