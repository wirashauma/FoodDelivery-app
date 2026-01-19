/**
 * Platform Detection Middleware
 * 
 * Detects whether a request comes from:
 * - Web application (has Origin header)
 * - Mobile application (no Origin header, custom headers)
 * 
 * Based on Barasiah's MOBILE_ARCHITECTURE.md
 */

const detectPlatform = (req, res, next) => {
  const platformHeader = req.headers['x-platform'];
  const userAgent = req.headers['user-agent'] || '';
  
  // Check custom platform header first
  if (platformHeader === 'mobile') {
    req.platform = 'mobile';
    req.deviceId = req.headers['x-device-id'] || 'unknown';
  }
  // Check User-Agent for mobile app signature
  else if (userAgent.includes('FoodDelivery-Mobile') || userAgent.includes('titipin')) {
    req.platform = 'mobile';
    // Extract version info if available
    const versionMatch = userAgent.match(/titipin\/(\d+\.\d+\.\d+)/);
    req.deviceVersion = versionMatch ? versionMatch[1] : 'unknown';
  }
  // Check for browser Origin header (web app)
  else if (req.headers.origin) {
    req.platform = 'web';
  }
  // Default to mobile for API requests without Origin
  else {
    req.platform = 'mobile';
    req.deviceId = req.headers['x-device-id'] || 'unknown';
  }
  
  next();
};

/**
 * Middleware to require web platform only
 * Use this for admin-only routes or web-specific features
 */
const requireWebPlatform = (req, res, next) => {
  if (req.platform === 'mobile') {
    return res.status(403).json({
      success: false,
      error: 'This feature is only available on web platform',
      message: 'Please access this feature from the web dashboard',
    });
  }
  next();
};

/**
 * Middleware to require mobile platform only
 * Use this if you have mobile-specific features
 */
const requireMobilePlatform = (req, res, next) => {
  if (req.platform !== 'mobile') {
    return res.status(403).json({
      success: false,
      error: 'This feature is only available on mobile app',
    });
  }
  next();
};

/**
 * Middleware to block specific roles from mobile
 * Example: block ADMIN from mobile access
 */
const blockRoleOnMobile = (blockedRoles = []) => {
  return (req, res, next) => {
    if (req.platform === 'mobile' && req.user && blockedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `${req.user.role} role is not available on mobile app`,
        message: 'Please use the web dashboard for admin functions',
      });
    }
    next();
  };
};

module.exports = {
  detectPlatform,
  requireWebPlatform,
  requireMobilePlatform,
  blockRoleOnMobile,
};
