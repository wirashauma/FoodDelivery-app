// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes - Apply auth rate limiter to prevent brute force
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes
router.post('/logout-all', authMiddleware.verifyToken, authController.logoutAll);
router.get('/sessions', authMiddleware.verifyToken, authController.getSessions);
router.post('/change-password', authMiddleware.verifyToken, authController.changePassword);

module.exports = router;