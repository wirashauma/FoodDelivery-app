const Redis = require('ioredis');
const { config } = require('./config');

// Redis Configuration
const redisConfig = {
  host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
  port: config.redis?.port || process.env.REDIS_PORT || 6379,
  password: config.redis?.password || process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      console.warn('⚠️  Redis connection failed after 3 attempts - running without cache');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 500);
    return delay;
  },
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
};

// Create Redis client
let redis;
let isRedisAvailable = false;
let connectionAttempted = false;

async function initializeRedis() {
  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    redis = new Redis(redisConfig);
    
    // Redis event handlers
    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redis.on('error', (err) => {
      // Only log first error to avoid spam
      if (isRedisAvailable) {
        console.error('⚠️  Redis connection lost:', err.message);
      }
      isRedisAvailable = false;
    });

    redis.on('ready', () => {
      console.log('✅ Redis is ready to use');
      isRedisAvailable = true;
    });
    
    // Try to connect with timeout
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
    ]);
    
  } catch (error) {
    console.warn('⚠️  Redis not available - running without cache');
    isRedisAvailable = false;
    
    // Disconnect failed client
    if (redis) {
      try {
        await redis.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    
    // Create mock redis client
    redis = {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      setex: async () => 'OK',
      expire: async () => 1,
      ttl: async () => -1,
      exists: async () => 0,
      keys: async () => [],
      quit: async () => {},
      disconnect: async () => {},
      connect: async () => {},
      ping: async () => { throw new Error('Redis not available'); },
    };
  }
}

// Initialize Redis on module load
initializeRedis().catch(() => {
  // Already handled in function
});

/**
 * Cache wrapper with automatic JSON serialization
 */
class CacheService {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} - Cached data or null
   */
  static async get(key) {
    if (!isRedisAvailable) return null;
    try {
      const data = await redis.get(key);
      if (!data) return null;
      
      // Try to parse as JSON, if fails return raw string
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache with automatic JSON serialization
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>} - Success status
   */
  static async set(key, value, ttl = 3600) {
    if (!isRedisAvailable) return false;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttl);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  static async del(key) {
    if (!isRedisAvailable) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'products:*')
   * @returns {Promise<number>} - Number of keys deleted
   */
  static async delPattern(pattern) {
    if (!isRedisAvailable) return 0;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Exists status
   */
  static async exists(key) {
    if (!isRedisAvailable) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or Set pattern (Get from cache, if not exists, call callback and cache result)
   * @param {string} key - Cache key
   * @param {Function} callback - Function to call if cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} - Cached or fresh data
   */
  static async getOrSet(key, callback, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        console.log(`Cache HIT for key: ${key}`);
        return cached;
      }

      // Cache miss, call callback
      console.log(`Cache MISS for key: ${key}, fetching fresh data...`);
      const fresh = await callback();
      
      // Save to cache
      await this.set(key, fresh, ttl);
      
      return fresh;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      // On error, just call callback without caching
      return await callback();
    }
  }

  /**
   * Increment counter
   * @param {string} key - Counter key
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<number>} - New counter value
   */
  static async incr(key, ttl = null) {
    try {
      const value = await redis.incr(key);
      if (ttl !== null && value === 1) {
        // Set expiry only on first increment
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Store geolocation data (for geo-fencing)
   * @param {string} key - Geo set key
   * @param {number} longitude - Longitude
   * @param {number} latitude - Latitude
   * @param {string} member - Member identifier (e.g., driver ID)
   * @returns {Promise<boolean>} - Success status
   */
  static async geoAdd(key, longitude, latitude, member) {
    try {
      await redis.geoadd(key, longitude, latitude, member);
      return true;
    } catch (error) {
      console.error(`Geo add error:`, error);
      return false;
    }
  }

  /**
   * Find nearby members within radius
   * @param {string} key - Geo set key
   * @param {number} longitude - Center longitude
   * @param {number} latitude - Center latitude
   * @param {number} radius - Radius in kilometers
   * @returns {Promise<Array>} - Array of nearby members
   */
  static async geoRadius(key, longitude, latitude, radius) {
    try {
      const members = await redis.georadius(
        key,
        longitude,
        latitude,
        radius,
        'km',
        'WITHDIST',
        'ASC'
      );
      return members;
    } catch (error) {
      console.error(`Geo radius error:`, error);
      return [];
    }
  }

  /**
   * Remove member from geo set
   * @param {string} key - Geo set key
   * @param {string} member - Member identifier
   * @returns {Promise<boolean>} - Success status
   */
  static async geoRem(key, member) {
    try {
      await redis.zrem(key, member);
      return true;
    } catch (error) {
      console.error(`Geo remove error:`, error);
      return false;
    }
  }
}

module.exports = {
  redis,
  CacheService,
  isRedisAvailable: () => isRedisAvailable,
};
