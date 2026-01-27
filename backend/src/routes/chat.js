const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/chats
// @desc    Mengambil daftar chat aktif (untuk User & Deliverer)
// @access  Private
router.get('/', authMiddleware.verifyToken, chatController.getChatList);

// @route   GET /api/chats/:chatId/messages
// @desc    Mengambil riwayat pesan untuk satu chat (order)
// @access  Private
router.get('/:chatId/messages', authMiddleware.verifyToken, chatController.getMessages);

// @route   POST /api/chats/:chatId/messages
// @desc    Mengirim pesan ke chat
// @access  Private
router.post('/:chatId/messages', authMiddleware.verifyToken, chatController.sendMessage);

module.exports = router;