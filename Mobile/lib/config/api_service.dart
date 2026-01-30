import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:titipin_app/config/api_config.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: 'accessToken');
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
  }

  static Future<void> clearTokens() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
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

  // GET request
  static Future<http.Response> get(
    String endpoint, {
    Map<String, String>? queryParams,
    bool requiresAuth = true,
  }) async {
    final uri = Uri.parse(endpoint).replace(queryParameters: queryParams);
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    return await http
        .get(uri, headers: headers)
        .timeout(ApiConfig.requestTimeout);
  }

  // POST request
  static Future<http.Response> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
  }) async {
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    return await http
        .post(
          Uri.parse(endpoint),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(ApiConfig.requestTimeout);
  }

  // PUT request
  static Future<http.Response> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
  }) async {
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    return await http
        .put(
          Uri.parse(endpoint),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(ApiConfig.requestTimeout);
  }

  // DELETE request
  static Future<http.Response> delete(
    String endpoint, {
    bool requiresAuth = true,
  }) async {
    final headers = requiresAuth
        ? await getAuthHeaders()
        : {'Content-Type': 'application/json'};

    return await http
        .delete(Uri.parse(endpoint), headers: headers)
        .timeout(ApiConfig.requestTimeout);
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
