const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/chats/my-list
// @desc    Mengambil daftar chat aktif (untuk User & Deliverer)
// @access  Private
router.get('/my-list', authMiddleware.verifyToken, chatController.getChatList);

// @route   GET /api/chats/:orderId/messages
// @desc    Mengambil riwayat pesan untuk satu order
// @access  Private
router.get('/:orderId/messages', authMiddleware.verifyToken, chatController.getMessages);

module.exports = router;