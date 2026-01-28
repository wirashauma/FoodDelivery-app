// ============================================
// RBAC (Role-Based Access Control) Middleware
// ============================================
// Supports hierarchical roles and permission-based access

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Role hierarchy - higher level roles inherit lower level permissions
const roleHierarchy = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE', 'MERCHANT', 'DELIVERER', 'CUSTOMER'],
  ADMIN: ['ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE', 'MERCHANT', 'DELIVERER', 'CUSTOMER'],
  OPERATIONS_STAFF: ['OPERATIONS_STAFF', 'MERCHANT', 'DELIVERER', 'CUSTOMER'],
  FINANCE_STAFF: ['FINANCE_STAFF', 'MERCHANT', 'CUSTOMER'],
  CUSTOMER_SERVICE: ['CUSTOMER_SERVICE', 'CUSTOMER'],
  MERCHANT: ['MERCHANT'],
  DELIVERER: ['DELIVERER'],
  CUSTOMER: ['CUSTOMER']
};

// Permission definitions for each role
const rolePermissions = {
  SUPER_ADMIN: [
    '*', // All permissions
  ],
  ADMIN: [
    'dashboard:read',
    'users:*',
    'merchants:*',
    'drivers:*',
    'orders:*',
    'products:*',
    'promos:*',
    'vouchers:*',
    'complaints:*',
    'reports:*',
    'settings:read',
    'audit:read',
  ],
  OPERATIONS_STAFF: [
    'dashboard:read',
    'orders:read',
    'orders:update',
    'orders:cancel',
    'orders:assign_driver',
    'drivers:read',
    'drivers:update_status',
    'merchants:read',
    'merchants:update_status',
    'complaints:read',
    'complaints:respond',
  ],
  FINANCE_STAFF: [
    'dashboard:read',
    'orders:read',
    'reports:*',
    'payouts:*',
    'refunds:*',
    'commissions:*',
    'merchants:read',
    'drivers:read',
  ],
  CUSTOMER_SERVICE: [
    'dashboard:read',
    'users:read',
    'orders:read',
    'complaints:*',
    'refunds:create',
    'refunds:read',
  ],
  MERCHANT: [
    'merchant:own',
    'products:own',
    'orders:own',
    'reviews:own',
    'payouts:own',
  ],
  DELIVERER: [
    'driver:own',
    'orders:delivery',
    'wallet:own',
  ],
  CUSTOMER: [
    'profile:own',
    'orders:own',
    'cart:own',
    'reviews:create',
    'complaints:own',
  ]
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (userRole, requiredPermission) => {
  const permissions = rolePermissions[userRole] || [];
  
  // Check for wildcard permission
  if (permissions.includes('*')) return true;
  
  // Check exact match
  if (permissions.includes(requiredPermission)) return true;
  
  // Check category wildcard (e.g., 'users:*' matches 'users:read')
  const [category, action] = requiredPermission.split(':');
  if (permissions.includes(`${category}:*`)) return true;
  
  return false;
};

/**
 * Check if user's role is allowed based on role hierarchy
 */
const isRoleAllowed = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  
  const effectiveRoles = roleHierarchy[userRole] || [userRole];
  return allowedRoles.some(role => effectiveRoles.includes(role));
};

/**
 * Middleware: Authorize by roles
 * @param {string[]} allowedRoles - Array of allowed role names
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!isRoleAllowed(req.user.role, allowedRoles)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Middleware: Authorize by permission
 * @param {string} permission - Required permission string (e.g., 'users:create')
 */
const authorizePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Permission denied: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware: Check resource ownership
 * Used for routes where users can only access their own resources
 */
const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const resourceId = parseInt(req.params.id);

    try {
      let isOwner = false;

      switch (resourceType) {
        case 'order':
          const order = await prisma.order.findUnique({
            where: { id: resourceId },
            select: { customerId: true, driverId: true, merchantId: true }
          });
          if (order) {
            // Check if user is customer, driver, or merchant owner
            isOwner = order.customerId === userId || order.driverId === userId;
            if (!isOwner) {
              const merchant = await prisma.merchant.findUnique({
                where: { id: order.merchantId },
                select: { ownerId: true }
              });
              isOwner = merchant?.ownerId === userId;
            }
          }
          break;

        case 'merchant':
          const merchant = await prisma.merchant.findUnique({
            where: { id: resourceId },
            select: { ownerId: true }
          });
          isOwner = merchant?.ownerId === userId;
          break;

        case 'address':
          const address = await prisma.userAddress.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = address?.userId === userId;
          break;

        case 'complaint':
          const complaint = await prisma.complaint.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = complaint?.userId === userId;
          break;

        case 'review':
          const review = await prisma.review.findUnique({
            where: { id: resourceId },
            select: { customerId: true }
          });
          isOwner = review?.customerId === userId;
          break;

        default:
          isOwner = false;
      }

      // Admin roles bypass ownership check
      const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE'];
      if (adminRoles.includes(req.user.role)) {
        isOwner = true;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};

/**
 * Middleware: Log admin actions for audit trail
 */
const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    res.send = async function(body) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE'];
          
          if (adminRoles.includes(req.user.role)) {
            await prisma.auditLog.create({
              data: {
                adminId: req.user.id,
                action: action,
                entityType: entityType,
                entityId: req.params.id ? parseInt(req.params.id) : null,
                oldValues: req.body._oldValues || null,
                newValues: req.body || null,
                ipAddress: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'],
                description: `${action} on ${entityType} ${req.params.id ? `#${req.params.id}` : ''}`
              }
            });
          }
        } catch (error) {
          console.error('Audit log error:', error);
        }
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  authorize,
  authorizePermission,
  checkOwnership,
  auditLog,
  hasPermission,
  isRoleAllowed,
  roleHierarchy,
  rolePermissions
};
