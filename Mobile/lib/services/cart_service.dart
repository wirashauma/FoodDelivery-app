import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/config/api_config.dart';

class CartService {
  static const _storage = FlutterSecureStorage();

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  static Future<List<Map<String, dynamic>>> getCartItems() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse(ApiConfig.cartEndpoint),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['items'] != null) {
        return List<Map<String, dynamic>>.from(data['items']);
      }
      return [];
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat keranjang');
    }
  }

  static Future<void> addToCart(String productId, int quantity) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.post(
      Uri.parse(ApiConfig.cartEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'productId': productId,
        'quantity': quantity,
      }),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal menambahkan ke keranjang');
    }
  }

  static Future<void> updateCartItem(String cartItemId, int quantity) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.put(
      Uri.parse('${ApiConfig.cartEndpoint}/$cartItemId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'quantity': quantity,
      }),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal update keranjang');
    }
  }

  static Future<void> removeFromCart(String cartItemId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.delete(
      Uri.parse('${ApiConfig.cartEndpoint}/$cartItemId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal menghapus dari keranjang');
    }
  }

  static Future<void> clearCart() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.delete(
      Uri.parse('${ApiConfig.cartEndpoint}/clear'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal mengosongkan keranjang');
    }
  }
}
