import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_config.dart';
import '../../core/constants/api_service.dart';

class RatingService {
  final ApiService _apiService = ApiService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _apiService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Rate a completed order
  Future<Map<String, dynamic>> rateOrder({
    required int orderId,
    required int score,
    String? comment,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse(ApiConfig.rateOrderEndpoint(orderId)),
        headers: headers,
        body: jsonEncode({
          'score': score,
          'comment': comment,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'Gagal mengirim rating');
      }
    } catch (e) {
      throw Exception('Gagal mengirim rating: $e');
    }
  }

  /// Check if order is already rated
  Future<Map<String, dynamic>> checkOrderRating(int orderId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse(ApiConfig.checkOrderRatingEndpoint(orderId)),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Gagal memeriksa rating');
      }
    } catch (e) {
      throw Exception('Gagal memeriksa rating: $e');
    }
  }

  /// Get deliverer's ratings
  Future<Map<String, dynamic>> getDelivererRatings(
    int delivererId, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
            '${ApiConfig.delivererRatingsEndpoint(delivererId)}?page=$page&limit=$limit'),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Gagal mengambil rating deliverer');
      }
    } catch (e) {
      throw Exception('Gagal mengambil rating deliverer: $e');
    }
  }

  /// Get my ratings (for deliverer)
  Future<Map<String, dynamic>> getMyRatings({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${ApiConfig.myRatingsEndpoint}?page=$page&limit=$limit'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Gagal mengambil rating saya');
      }
    } catch (e) {
      throw Exception('Gagal mengambil rating saya: $e');
    }
  }
}
