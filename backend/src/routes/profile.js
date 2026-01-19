// backend/src/routes/profile.js

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware'); // "Satpam" Anda

// @route   GET /api/profile/me
// @desc    Ambil data profil user yang sedang login
// @access  Private (Dilindungi Token)
// [MODIFIKASI]: Panggil fungsinya -> authMiddleware.verifyToken
router.get('/me', authMiddleware.verifyToken, profileController.getProfile);

// @route   POST /api/profile/me
// @desc    Buat atau update data profil user (untuk profile_complete_screen)
// @access  Private (Dilindungi Token)
// [MODIFIKASI]: Panggil fungsinya -> authMiddleware.verifyToken
router.post('/me', authMiddleware.verifyToken, profileController.updateProfile);

module.exports = router;