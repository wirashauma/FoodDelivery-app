// backend/src/controllers/profileController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dipanggil oleh: GET /api/profile/me
exports.getProfile = async (req, res) => {
  try {
    // Query using the correct field name from the User model
    const userProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        fullName: true,
        nickname: true,
        dateOfBirth: true,
        gender: true,
        profilePicture: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }
    
    // Transform to expected format for frontend compatibility
    res.json({
      user_id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      nama: userProfile.fullName || userProfile.nickname || '',
      no_hp: userProfile.phone || '',
      foto_profil: userProfile.profilePicture || '',
      tgl_lahir: userProfile.dateOfBirth,
      ...userProfile
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Dipanggil oleh: POST /api/profile/me
exports.updateProfile = async (req, res) => {
  try {
    // Accept both old and new field names for backwards compatibility
    const { 
      nama, fullName,
      tgl_lahir, dateOfBirth,
      no_hp, phone,
      alamat,
      foto_profil, profilePicture,
      nickname,
      gender
    } = req.body;

    const updateData = {};
    
    // Handle fullName/nama
    if (fullName || nama) {
      updateData.fullName = fullName || nama;
    }
    
    // Handle nickname
    if (nickname) {
      updateData.nickname = nickname;
    }
    
    // Handle dateOfBirth/tgl_lahir
    if (dateOfBirth || tgl_lahir) {
      const dateValue = dateOfBirth || tgl_lahir;
      updateData.dateOfBirth = dateValue ? new Date(dateValue) : null;
    }
    
    // Handle phone/no_hp
    if (phone || no_hp) {
      updateData.phone = phone || no_hp;
    }
    
    // Handle profilePicture/foto_profil
    if (profilePicture || foto_profil) {
      updateData.profilePicture = profilePicture || foto_profil;
    }
    
    // Handle gender
    if (gender) {
      updateData.gender = gender;
    }

    const updatedProfile = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        fullName: true,
        nickname: true,
        dateOfBirth: true,
        gender: true,
        profilePicture: true,
      }
    });
    
    res.json({ 
      msg: 'Profil berhasil diperbarui', 
      profile: {
        user_id: updatedProfile.id,
        email: updatedProfile.email,
        role: updatedProfile.role,
        nama: updatedProfile.fullName || updatedProfile.nickname || '',
        no_hp: updatedProfile.phone || '',
        foto_profil: updatedProfile.profilePicture || '',
        tgl_lahir: updatedProfile.dateOfBirth,
        ...updatedProfile
      }
    });

  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};