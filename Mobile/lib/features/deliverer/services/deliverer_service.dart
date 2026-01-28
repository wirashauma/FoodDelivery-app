import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class DelivererService {
  // [CONFIGURATION] Menggunakan API Config terpusat
  static String get _baseUrl => ApiConfig.baseUrl;
  final _storage = const FlutterSecureStorage();

  /// Get deliverer dashboard statistics
  /// Returns: { newOrders, activeOrders, completedThisMonth, totalCompleted, averageRating }
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.get(
        Uri.parse('$_baseUrl/orders/deliverer/dashboard/stats'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile', // [ENHANCEMENT] Platform header
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? {};
      } else {
        throw Exception(
            'Gagal memuat statistik dashboard: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting dashboard stats: $e');
      rethrow;
    }
  }

  /// Get active orders for deliverer
  Future<List<dynamic>> getActiveOrders() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.get(
        Uri.parse('$_baseUrl/orders/deliverer/active'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      } else {
        throw Exception('Gagal memuat pesanan aktif');
      }
    } catch (e) {
      debugPrint('Error getting active orders: $e');
      rethrow;
    }
  }

  /// Get completed orders for deliverer
  Future<Map<String, dynamic>> getCompletedOrders(
      {int limit = 20, int offset = 0}) async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.get(
        Uri.parse(
            '$_baseUrl/orders/deliverer/completed?limit=$limit&offset=$offset'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'orders': data['data'] ?? [],
          'pagination': data['pagination'] ?? {},
        };
      } else {
        throw Exception('Gagal memuat pesanan selesai');
      }
    } catch (e) {
      debugPrint('Error getting completed orders: $e');
      rethrow;
    }
  }

  /// Get available orders (not assigned yet)
  Future<List<dynamic>> getAvailableOrders() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.get(
        Uri.parse('$_baseUrl/orders/available'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      } else {
        throw Exception('Gagal memuat pesanan tersedia');
      }
    } catch (e) {
      debugPrint('Error getting available orders: $e');
      rethrow;
    }
  }

  /// Accept an order
  Future<Map<String, dynamic>> acceptOrder(int orderId) async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.post(
        Uri.parse('$_baseUrl/orders/$orderId/accept'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Gagal menerima pesanan');
      }
    } catch (e) {
      debugPrint('Error accepting order: $e');
      rethrow;
    }
  }

  /// Reject an order
  Future<Map<String, dynamic>> rejectOrder(int orderId,
      {String? reason}) async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.post(
        Uri.parse('$_baseUrl/orders/$orderId/reject'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
        body: jsonEncode({
          'reason': reason,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Gagal menolak pesanan');
      }
    } catch (e) {
      debugPrint('Error rejecting order: $e');
      rethrow;
    }
  }

  /// Update order status
  Future<Map<String, dynamic>> updateOrderStatus(
      int orderId, String newStatus) async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) throw Exception('Token tidak ditemukan');

      final response = await http.post(
        Uri.parse('$_baseUrl/orders/$orderId/update-status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
        body: jsonEncode({
          'status': newStatus,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Gagal memperbarui status pesanan');
      }
    } catch (e) {
      debugPrint('Error updating order status: $e');
      rethrow;
    }
  }
}
