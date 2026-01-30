import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/config/api_config.dart';

class RatingService {
  static const _storage = FlutterSecureStorage();

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  static Future<void> submitRating({
    required String orderId,
    required int rating,
    String? review,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final body = <String, dynamic>{
      'orderId': orderId,
      'rating': rating,
    };

    if (review != null && review.isNotEmpty) {
      body['review'] = review;
    }

    final response = await http.post(
      Uri.parse(ApiConfig.ratingsEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memberikan rating');
    }
  }

  static Future<Map<String, dynamic>?> getOrderRating(String orderId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse('${ApiConfig.ratingsEndpoint}/$orderId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 404) {
      return null;
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat rating');
    }
  }

  static Future<List<Map<String, dynamic>>> getDelivererRatings(
      String delivererId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse('${ApiConfig.ratingsEndpoint}/deliverer/$delivererId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => item as Map<String, dynamic>).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat rating deliverer');
    }
  }
}
