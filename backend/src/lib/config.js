// ============================================
// Application Configuration
// ============================================
// Centralized configuration with validation

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const optionalEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];

// Validate required environment variables on startup
const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.warn('⚠️  Running in development mode with fallback values');
    }
  }
  
  // Warn about optional but recommended vars
  const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    missingOptional.forEach(key => console.warn(`   - ${key}`));
  }
};

// Configuration object
const config = {
  // JWT Configuration
  jwt: {
    get secret() {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET is required in production');
        }
        console.warn('⚠️  Using fallback JWT_SECRET - NOT SAFE FOR PRODUCTION');
        return 'dev-only-fallback-secret-change-in-production';
      }
      return secret;
    },
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },

  // CORS Configuration
  cors: {
    get allowedOrigins() {
      const origins = process.env.ALLOWED_ORIGINS;
      if (origins) {
        return origins.split(',').map(o => o.trim());
      }
      // Default development origins
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
    }
  },

  // Supabase Configuration
  supabase: {
    get url() {
      return process.env.SUPABASE_URL || null;
    },
    get serviceKey() {
      return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;
    },
    get isConfigured() {
      return !!(this.url && this.serviceKey);
    }
  },

  // Role Configuration
  roles: {
    // All valid roles in the system
    all: ['CUSTOMER', 'DELIVERER', 'MERCHANT', 'ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE'],
    
    // Roles that can be selected during public registration
    publicRegistration: ['CUSTOMER', 'DELIVERER', 'MERCHANT'],
    
    // Admin roles (requires existing admin to create)
    admin: ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF', 'CUSTOMER_SERVICE'],
  },

  // Security Configuration
  security: {
    // Rate limiting
    rateLimit: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
      },
      register: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 registrations per hour per IP
      },
      otp: {
        windowMs: 60 * 1000, // 1 minute
        max: 1, // 1 OTP request per minute
      },
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per 15 minutes
      }
    },
    
    // Password requirements
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
    },
  },
};

module.exports = {
  config,
  validateEnv,
};
