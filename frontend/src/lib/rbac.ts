// ============================================
// RBAC (Role-Based Access Control) for Frontend
// ============================================

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'OPERATIONS_STAFF' 
  | 'FINANCE_STAFF' 
  | 'CUSTOMER_SERVICE' 
  | 'MERCHANT' 
  | 'DELIVERER' 
  | 'CUSTOMER';

// All admin-level roles that can access the admin panel
export const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATIONS_STAFF',
  'FINANCE_STAFF',
  'CUSTOMER_SERVICE',
  'MERCHANT',
];

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATIONS_STAFF: 'Staff Operasional',
  FINANCE_STAFF: 'Staff Keuangan',
  CUSTOMER_SERVICE: 'Customer Service',
  MERCHANT: 'Merchant',
  DELIVERER: 'Driver',
  CUSTOMER: 'Customer',
};

// Role colors for badges
export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  OPERATIONS_STAFF: 'bg-green-100 text-green-800',
  FINANCE_STAFF: 'bg-yellow-100 text-yellow-800',
  CUSTOMER_SERVICE: 'bg-pink-100 text-pink-800',
  MERCHANT: 'bg-orange-100 text-orange-800',
  DELIVERER: 'bg-cyan-100 text-cyan-800',
  CUSTOMER: 'bg-gray-100 text-gray-800',
};

// Menu access permissions per role
export interface MenuPermission {
  path: string;
  allowedRoles: UserRole[];
}

// Define which roles can access which paths
export const MENU_PERMISSIONS: MenuPermission[] = [
  // Dashboard - All admin roles
  { path: '/dashboard', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE', 'MERCHANT'] },
  
  // OMS - Operations
  { path: '/oms', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'] },
  { path: '/orders', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE', 'FINANCE_STAFF'] },
  
  // Merchants
  { path: '/merchants', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF'] },
  
  // Drivers
  { path: '/deliverers', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF'] },
  
  // Promos & Marketing
  { path: '/promos', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF'] },
  
  // Financial
  { path: '/financial', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'] },
  { path: '/earnings', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'] },
  
  // Master Data
  { path: '/master-data', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF'] },
  
  // Users
  { path: '/users', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'] },
  
  // Complaints
  { path: '/complaints', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE', 'OPERATIONS_STAFF'] },
  
  // Settings
  { path: '/settings', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  
  // Merchant-specific pages
  { path: '/merchant', allowedRoles: ['MERCHANT'] },
  { path: '/merchant/dashboard', allowedRoles: ['MERCHANT'] },
  { path: '/merchant/profile', allowedRoles: ['MERCHANT'] },
  { path: '/merchant/products', allowedRoles: ['MERCHANT'] },
  { path: '/merchant/orders', allowedRoles: ['MERCHANT'] },
  { path: '/merchant/earnings', allowedRoles: ['MERCHANT'] },
  { path: '/merchant/payouts', allowedRoles: ['MERCHANT'] },
];

/**
 * Check if a role can access a specific path
 */
export function canAccessPath(role: UserRole | null | undefined, path: string): boolean {
  if (!role) return false;
  
  // Super Admin can access everything
  if (role === 'SUPER_ADMIN') return true;
  
  // Find the permission for this path
  const permission = MENU_PERMISSIONS.find(p => {
    // Exact match
    if (path === p.path) return true;
    // Path starts with permission path (for nested routes)
    if (path.startsWith(p.path + '/')) return true;
    // Path with query params
    if (path.split('?')[0] === p.path) return true;
    return false;
  });
  
  if (!permission) {
    // If no specific permission found, check for parent path
    const pathParts = path.split('/').filter(Boolean);
    while (pathParts.length > 0) {
      const parentPath = '/' + pathParts.join('/');
      const parentPermission = MENU_PERMISSIONS.find(p => p.path === parentPath);
      if (parentPermission) {
        return parentPermission.allowedRoles.includes(role);
      }
      pathParts.pop();
    }
    return false;
  }
  
  return permission.allowedRoles.includes(role);
}

/**
 * Check if role is an admin-level role
 */
export function isAdminRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}

/**
 * Get the default redirect path for a role after login
 */
export function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'OPERATIONS_STAFF':
    case 'FINANCE_STAFF':
    case 'CUSTOMER_SERVICE':
      return '/dashboard';
    case 'MERCHANT':
      return '/merchant/dashboard';
    case 'DELIVERER':
      return '/deliverer/dashboard';
    case 'CUSTOMER':
    default:
      return '/user/dashboard';
  }
}

/**
 * Quick login accounts for development
 */
export const QUICK_LOGIN_ACCOUNTS = [
  { 
    email: 'superadmin@gmail.com', 
    password: 'SuperAdmin123', 
    role: 'SUPER_ADMIN' as UserRole, 
    label: 'Super Admin', 
    icon: 'Crown',
    color: 'from-purple-500 to-violet-600' 
  },
  { 
    email: 'finance@gmail.com', 
    password: 'Finance123', 
    role: 'FINANCE_STAFF' as UserRole, 
    label: 'Finance Staff', 
    icon: 'Wallet',
    color: 'from-yellow-500 to-amber-600' 
  },
  { 
    email: 'service@gmail.com', 
    password: 'Service123', 
    role: 'CUSTOMER_SERVICE' as UserRole, 
    label: 'Customer Service', 
    icon: 'Headphones',
    color: 'from-pink-500 to-rose-600' 
  },
  { 
    email: 'merchant@gmail.com', 
    password: 'Merchant123', 
    role: 'MERCHANT' as UserRole, 
    label: 'Merchant', 
    icon: 'Store',
    color: 'from-orange-500 to-red-600' 
  },
  { 
    email: 'shauma@gmail.com', 
    password: 'Wira1234', 
    role: 'CUSTOMER' as UserRole, 
    label: 'Customer', 
    icon: 'User',
    color: 'from-blue-500 to-cyan-600' 
  },
  { 
    email: 'admin@gmail.com', 
    password: 'Admin123', 
    role: 'ADMIN' as UserRole, 
    label: 'Admin', 
    icon: 'User',
    color: 'from-green-500 to-emerald-600' 
  },
];
