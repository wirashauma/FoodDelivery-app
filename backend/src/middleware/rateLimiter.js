const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Limits all API requests to 100 per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (optional - useful for debugging)
  skipSuccessfulRequests: false,
  // Skip failed requests (optional)
  skipFailedRequests: false,
});

/**
 * Authentication Rate Limiter (Stricter)
 * Prevents brute force attacks on login/register
 * Limits to 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register requests per windowMs
  message: {
    error: 'Terlalu banyak percobaan login/register. Silakan coba lagi setelah 15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed requests for auth
  skipSuccessfulRequests: true,
});

/**
 * Payment Rate Limiter (Moderate)
 * Prevents abuse of payment endpoints
 * Limits to 10 attempts per hour
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment requests per hour
  message: {
    error: 'Terlalu banyak transaksi pembayaran. Silakan coba lagi setelah 1 jam'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP/Verification Rate Limiter (Very Strict)
 * Prevents OTP spam/abuse
 * Limits to 3 attempts per hour
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 OTP requests per hour
  message: {
    error: 'Terlalu banyak permintaan OTP. Silakan coba lagi setelah 1 jam'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File Upload Rate Limiter
 * Prevents upload abuse
 * Limits to 20 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    error: 'Terlalu banyak upload file. Silakan coba lagi setelah 1 jam'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Search Rate Limiter
 * Prevents search API abuse
 * Limits to 30 searches per minute
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: {
    error: 'Terlalu banyak pencarian. Silakan coba lagi setelah 1 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  otpLimiter,
  uploadLimiter,
  searchLimiter,
};
