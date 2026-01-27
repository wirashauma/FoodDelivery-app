import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

/// Centralized API Service for making HTTP requests
///
/// This service handles:
/// - Authentication token management
/// - Common HTTP methods (GET, POST, PUT, DELETE, PATCH)
/// - Error handling
/// - Request/Response logging
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // ===========================================
  // TOKEN MANAGEMENT
  // ===========================================

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<void> removeToken() async {
    await _storage.delete(key: 'jwt_token');
  }

  // ===========================================
  // HTTP HEADERS
  // ===========================================

  Future<Map<String, String>> _getHeaders({bool requiresAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // ===========================================
  // HTTP METHODS
  // ===========================================

  /// GET Request
  Future<ApiResponse> get(
    String endpoint, {
    bool requiresAuth = true,
    Map<String, String>? queryParams,
  }) async {
    try {
      var uri = Uri.parse(endpoint);
      if (queryParams != null) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final response = await http
          .get(
            uri,
            headers: await _getHeaders(requiresAuth: requiresAuth),
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// POST Request
  Future<ApiResponse> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse(endpoint),
            headers: await _getHeaders(requiresAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// PUT Request
  Future<ApiResponse> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
  }) async {
    try {
      final response = await http
          .put(
            Uri.parse(endpoint),
            headers: await _getHeaders(requiresAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// PATCH Request
  Future<ApiResponse> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
  }) async {
    try {
      final response = await http
          .patch(
            Uri.parse(endpoint),
            headers: await _getHeaders(requiresAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// DELETE Request
  Future<ApiResponse> delete(
    String endpoint, {
    bool requiresAuth = true,
  }) async {
    try {
      final response = await http
          .delete(
            Uri.parse(endpoint),
            headers: await _getHeaders(requiresAuth: requiresAuth),
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  // ===========================================
  // RESPONSE HANDLING
  // ===========================================

  ApiResponse _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    dynamic data;

    try {
      data = jsonDecode(response.body);
    } catch (e) {
      data = response.body;
    }

    if (statusCode >= 200 && statusCode < 300) {
      return ApiResponse(
        success: true,
        data: data,
        statusCode: statusCode,
      );
    } else {
      String errorMessage = 'Unknown error occurred';
      if (data is Map && data.containsKey('message')) {
        errorMessage = data['message'];
      } else if (data is Map && data.containsKey('error')) {
        errorMessage = data['error'];
      }

      return ApiResponse(
        success: false,
        error: errorMessage,
        statusCode: statusCode,
        data: data,
      );
    }
  }
}

/// API Response wrapper class
class ApiResponse {
  final bool success;
  final dynamic data;
  final String? error;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.statusCode,
  });

  @override
  String toString() {
    return 'ApiResponse(success: $success, statusCode: $statusCode, data: $data, error: $error)';
  }
}
