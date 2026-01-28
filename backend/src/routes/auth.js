// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout-all', authMiddleware.verifyToken, authController.logoutAll);
router.get('/sessions', authMiddleware.verifyToken, authController.getSessions);
router.post('/change-password', authMiddleware.verifyToken, authController.changePassword);

module.exports = router;