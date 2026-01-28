// ============================================
// Enhanced Auth Routes - OTP & SSO Support
// ============================================

const express = require('express');
const router = express.Router();
const enhancedAuthController = require('../controllers/enhancedAuthController');
const { authenticate } = require('../middleware/authMiddleware');

// ==================== OTP AUTHENTICATION ====================

// Request OTP
router.post('/otp/request', enhancedAuthController.requestOTP);

// Verify OTP and login/register
router.post('/otp/verify', enhancedAuthController.verifyOTP);

// ==================== SOCIAL LOGIN ====================

// Google OAuth
router.post('/google', enhancedAuthController.googleAuth);

// Apple Sign-In
router.post('/apple', enhancedAuthController.appleAuth);

// ==================== EMAIL/PASSWORD ====================

// Register
router.post('/register', enhancedAuthController.register);

// Login
router.post('/login', enhancedAuthController.login);

// ==================== TOKEN MANAGEMENT ====================

// Refresh token
router.post('/refresh-token', enhancedAuthController.refreshToken);

// Logout
router.post('/logout', authenticate, enhancedAuthController.logout);

// Get current user
router.get('/me', authenticate, enhancedAuthController.getCurrentUser);

module.exports = router;
