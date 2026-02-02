const fetch = require('node-fetch');
const { config } = require('./config');
const { CacheService } = require('./redis');

/**
 * Route Service - Menggunakan OSRM atau Mapbox untuk route optimization
 */
class RouteService {
  /**
   * Calculate route distance and duration
   * @param {Object} origin - {latitude, longitude}
   * @param {Object} destination - {latitude, longitude}
   * @param {string} provider - 'osrm' or 'mapbox'
   * @returns {Promise<Object>} - {distance, duration, polyline}
   */
  static async calculateRoute(origin, destination, provider = 'osrm') {
    try {
      // Create cache key
      const cacheKey = `route:${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}`;
      
      // Try to get from cache (cache for 1 hour)
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        console.log('Route cache HIT');
        return cached;
      }

      let result;
      
      if (provider === 'mapbox' && config.maps.mapbox.isConfigured) {
        result = await this.calculateRouteMapbox(origin, destination);
      } else {
        // Default to OSRM (free)
        result = await this.calculateRouteOSRM(origin, destination);
      }

      // Cache result for 1 hour
      await CacheService.set(cacheKey, result, 3600);
      
      return result;
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback to straight-line distance
      return this.calculateStraightLineDistance(origin, destination);
    }
  }

  /**
   * Calculate route using OSRM (Open Source Routing Machine)
   * Free and can be self-hosted
   */
  static async calculateRouteOSRM(origin, destination) {
    const baseUrl = config.maps.osrm.baseUrl;
    const url = `${baseUrl}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('OSRM route not found');
    }

    const route = data.routes[0];

    return {
      distance: (route.distance / 1000).toFixed(2), // Convert meters to km
      duration: Math.ceil(route.duration / 60), // Convert seconds to minutes
      polyline: route.geometry, // Encoded polyline
      provider: 'osrm',
    };
  }

  /**
   * Calculate route using Mapbox Directions API
   * More accurate but paid service
   */
  static async calculateRouteMapbox(origin, destination) {
    const accessToken = config.maps.mapbox.accessToken;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=polyline&overview=full&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Mapbox route not found');
    }

    const route = data.routes[0];

    return {
      distance: (route.distance / 1000).toFixed(2), // Convert meters to km
      duration: Math.ceil(route.duration / 60), // Convert seconds to minutes
      polyline: route.geometry, // Encoded polyline
      provider: 'mapbox',
    };
  }

  /**
   * Calculate straight-line distance using Haversine formula
   * Fallback when routing API is not available
   */
  static calculateStraightLineDistance(origin, destination) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(destination.latitude - origin.latitude);
    const dLon = this.toRad(destination.longitude - origin.longitude);
    
    const lat1 = this.toRad(origin.latitude);
    const lat2 = this.toRad(destination.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration: assume average speed 30 km/h in city
    const duration = Math.ceil((distance / 30) * 60);

    return {
      distance: distance.toFixed(2),
      duration,
      polyline: null,
      provider: 'haversine',
      isEstimate: true,
    };
  }

  /**
   * Convert degrees to radians
   */
  static toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find nearby drivers within radius using geo-fencing
   * @param {Object} location - {latitude, longitude}
   * @param {number} radius - Radius in km
   * @returns {Promise<Array>} - Array of nearby driver IDs with distances
   */
  static async findNearbyDrivers(location, radius = 5) {
    try {
      const drivers = await CacheService.geoRadius(
        'drivers:online',
        location.longitude,
        location.latitude,
        radius
      );

      return drivers.map(([driverId, distance]) => ({
        driverId: parseInt(driverId),
        distance: parseFloat(distance),
      }));
    } catch (error) {
      console.error('Find nearby drivers error:', error);
      return [];
    }
  }

  /**
   * Update driver location in Redis geo set
   * @param {number} driverId - Driver ID
   * @param {Object} location - {latitude, longitude}
   * @returns {Promise<boolean>}
   */
  static async updateDriverLocation(driverId, location) {
    try {
      await CacheService.geoAdd(
        'drivers:online',
        location.longitude,
        location.latitude,
        driverId.toString()
      );
      return true;
    } catch (error) {
      console.error('Update driver location error:', error);
      return false;
    }
  }

  /**
   * Remove driver from online pool
   * @param {number} driverId - Driver ID
   * @returns {Promise<boolean>}
   */
  static async removeDriverFromOnlinePool(driverId) {
    try {
      await CacheService.geoRem('drivers:online', driverId.toString());
      return true;
    } catch (error) {
      console.error('Remove driver error:', error);
      return false;
    }
  }

  /**
   * Calculate delivery fee based on distance
   * @param {number} distance - Distance in km
   * @returns {number} - Delivery fee in IDR
   */
  static calculateDeliveryFee(distance) {
    const baseRate = 5000; // Base fee
    const perKmRate = 2000; // Per km rate
    
    // First 2 km = base rate
    if (distance <= 2) {
      return baseRate;
    }
    
    // After 2 km, add per km rate
    const additionalDistance = distance - 2;
    const fee = baseRate + (additionalDistance * perKmRate);
    
    // Round to nearest 1000
    return Math.ceil(fee / 1000) * 1000;
  }

  /**
   * Estimate delivery time based on distance and time of day
   * @param {number} distance - Distance in km
   * @param {Date} orderTime - Order time
   * @returns {number} - Estimated minutes
   */
  static estimateDeliveryTime(distance, orderTime = new Date()) {
    const hour = orderTime.getHours();
    
    // Average speed varies by time of day (rush hour vs normal)
    let avgSpeed = 30; // km/h
    
    // Rush hour (7-9 AM, 5-7 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      avgSpeed = 20;
    }
    
    // Night time (faster)
    if (hour >= 22 || hour <= 5) {
      avgSpeed = 40;
    }
    
    const travelTime = (distance / avgSpeed) * 60; // minutes
    const preparationTime = 15; // Assume 15 min preparation
    const pickupTime = 5; // 5 min for pickup
    
    return Math.ceil(travelTime + preparationTime + pickupTime);
  }
}

module.exports = RouteService;
