import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:titipin_app/config/api_config.dart';

/// Simple in-memory cache for API responses
class _ApiCache {
  static final Map<String, _CacheEntry> _cache = {};
  static const Duration defaultCacheDuration = Duration(minutes: 5);

  static String? get(String key) {
    final entry = _cache[key];
    if (entry == null) return null;

    if (DateTime.now().isAfter(entry.expiry)) {
      _cache.remove(key);
      return null;
    }

    return entry.data;
  }

  static void set(String key, String data, {Duration? duration}) {
    final expiry = DateTime.now().add(duration ?? defaultCacheDuration);
    _cache[key] = _CacheEntry(data: data, expiry: expiry);
  }

  static void invalidatePattern(String pattern) {
    _cache.removeWhere((key, value) => key.contains(pattern));
  }

  static void clear() {
    _cache.clear();
  }
}

class _CacheEntry {
  final String data;
  final DateTime expiry;

  _CacheEntry({required this.data, required this.expiry});
}

class ApiService {
  static const _storage = FlutterSecureStorage();

  // Cached token to avoid frequent secure storage reads
  static String? _cachedAccessToken;
  static DateTime? _tokenCacheTime;
  static const Duration _tokenCacheDuration = Duration(minutes: 1);

  static Future<String?> getAccessToken() async {
    // Return cached token if still valid
    if (_cachedAccessToken != null &&
        _tokenCacheTime != null &&
        DateTime.now().difference(_tokenCacheTime!) < _tokenCacheDuration) {
      return _cachedAccessToken;
    }

    _cachedAccessToken = await _storage.read(key: 'accessToken');
    _tokenCacheTime = DateTime.now();
    return _cachedAccessToken;
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refreshToken');
  }

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);
    // Update cache
    _cachedAccessToken = accessToken;
    _tokenCacheTime = DateTime.now();
  }

  static Future<void> clearTokens() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
    // Clear cached token
    _cachedAccessToken = null;
    _tokenCacheTime = null;
    // Clear all API cache on logout
    _ApiCache.clear();
  }

  static bool isTokenExpired(String token) {
    try {
      return JwtDecoder.isExpired(token);
    } catch (e) {
      return true;
    }
  }

  static Map<String, dynamic>? decodeToken(String token) {
    try {
      return JwtDecoder.decode(token);
    } catch (e) {
      return null;
    }
  }

  static Future<bool> refreshAccessToken() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse(ApiConfig.refreshTokenEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'] ?? refreshToken,
        );
        return true;
      }
    } catch (e) {
      debugPrint('Error refreshing token: $e');
    }
    return false;
  }

  static Future<Map<String, String>> getAuthHeaders() async {
    final token = await getAccessToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // GET request with optional caching
  static Future<http.Response> get(
    String endpoint, {
    Map<String, String>? queryParams,
    bool requiresAuth = true,
    bool useCache = false,
    Duration? cacheDuration,
  }) async {
    final uri = Uri.parse(endpoint).replace(queryParameters: queryParams);
    final cacheKey = uri.toString();

    // Check cache first if caching is enabled
    if (useCache) {
      final cachedData = _ApiCache.get(cacheKey);
      if (cachedData != null) {
        debugPrint('Cache hit: $cacheKey');
        return http.Response(cachedData, 200);
      }
    }

    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    final response =
        await http.get(uri, headers: headers).timeout(ApiConfig.requestTimeout);

    // Cache successful responses
    if (useCache && response.statusCode == 200) {
      _ApiCache.set(cacheKey, response.body, duration: cacheDuration);
    }

    return response;
  }

  // POST request - invalidates related cache
  static Future<http.Response> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
    String? invalidateCachePattern,
  }) async {
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    final response = await http
        .post(
          Uri.parse(endpoint),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(ApiConfig.requestTimeout);

    // Invalidate cache on successful mutation
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (invalidateCachePattern != null) {
        _ApiCache.invalidatePattern(invalidateCachePattern);
      }
    }

    return response;
  }

  // PUT request - invalidates related cache
  static Future<http.Response> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
    String? invalidateCachePattern,
  }) async {
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    final response = await http
        .put(
          Uri.parse(endpoint),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(ApiConfig.requestTimeout);

    // Invalidate cache on successful mutation
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (invalidateCachePattern != null) {
        _ApiCache.invalidatePattern(invalidateCachePattern);
      }
    }

    return response;
  }

  // DELETE request - invalidates related cache
  static Future<http.Response> delete(
    String endpoint, {
    bool requiresAuth = true,
    String? invalidateCachePattern,
  }) async {
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    final response = await http
        .delete(Uri.parse(endpoint), headers: headers)
        .timeout(ApiConfig.requestTimeout);

    // Invalidate cache on successful deletion
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (invalidateCachePattern != null) {
        _ApiCache.invalidatePattern(invalidateCachePattern);
      }
    }

    return response;
  }

  /// Invalidate specific cache entries
  static void invalidateCache(String pattern) {
    _ApiCache.invalidatePattern(pattern);
  }

  /// Clear all cached data
  static void clearCache() {
    _ApiCache.clear();
  }

  // Login
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await post(
      ApiConfig.loginEndpoint,
      body: {'email': email, 'password': password},
      requiresAuth: false,
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      await saveTokens(
        accessToken: data['accessToken'],
        refreshToken: data['refreshToken'],
      );
      return data;
    } else {
      throw Exception(data['error'] ?? 'Login gagal');
    }
  }

  // Register
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await post(
      ApiConfig.registerEndpoint,
      body: {
        'name': name,
        'email': email,
        'password': password,
      },
      requiresAuth: false,
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 201) {
      if (data['accessToken'] != null) {
        await saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
      }
      return data;
    } else {
      throw Exception(data['error'] ?? 'Registrasi gagal');
    }
  }

  // Logout
  static Future<void> logout() async {
    try {
      await post(ApiConfig.logoutEndpoint);
    } catch (e) {
      debugPrint('Error during logout: $e');
    } finally {
      await clearTokens();
    }
  }

  // Check if logged in
  static Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    if (token == null) return false;

    if (isTokenExpired(token)) {
      return await refreshAccessToken();
    }
    return true;
  }
}
