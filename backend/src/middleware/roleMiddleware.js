/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides authorization checks based on user roles:
 * - CUSTOMER: Regular users placing orders
 * - DELIVERER: Users delivering/handling orders
 * - ADMIN: Administrative access (web-only)
 */

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No user found in request',
      });
    }

    if (!req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User role not found',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is authenticated
 */
const authenticate = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
    });
  }
  next();
};

/**
 * Optional authentication - continues even if not authenticated
 */
const optionalAuthenticate = (req, res, next) => {
  // If authentication exists, it's fine
  // If not, continue anyway
  next();
};

module.exports = {
  authorize,
  authenticate,
  optionalAuthenticate,
};
