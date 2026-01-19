// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * [ENHANCED] Verify JWT Token with Platform Support
 * 
 * Changes from original:
 * - Stores decoded user info in req.user
 * - Includes platform information in token verification
 * - Adds error logging for debugging
 * - Supports platform-specific token validation
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token tidak ada' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Format token salah' });

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, decodedPayload) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Token tidak valid' });
    }
 
    // Extract user info from token
    req.user = decodedPayload.user;
    
    // [NEW] Store platform info from token if available
    if (decodedPayload.platform) {
      req.tokenPlatform = decodedPayload.platform;
    }
    
    // [NEW] Verify platform matches if platform detection middleware ran
    if (req.platform && decodedPayload.platform && req.platform !== decodedPayload.platform) {
      console.warn(`Platform mismatch: token=${decodedPayload.platform}, request=${req.platform}`);
      // You can choose to be strict (reject) or lenient (allow)
      // For now, we'll allow it to support legacy tokens
    }
    
    next(); // Lanjutkan ke "Manajer" (Controller)
  });
};

/**
 * [NEW] Generate JWT Token with Platform Support
 * 
 * Returns a JWT token that includes:
 * - User information (id, email, role)
 * - Platform information (web or mobile)
 * - Token expiration
 */
exports.generateToken = (user, platform = 'web', expiresIn = '7d') => {
  const payload = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role || 'CUSTOMER',
      name: user.name,
    },
    platform: platform, // Include platform in token
    iat: Math.floor(Date.now() / 1000), // Issued at
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: expiresIn,
  });
};