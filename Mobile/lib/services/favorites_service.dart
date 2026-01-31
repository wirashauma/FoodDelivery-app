import 'package:titipin_app/models/product_model.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class FavoritesService {
  static const _storage = FlutterSecureStorage();
  static const String _favoritesKey = 'favorites';

  // Get all favorites (local storage for now)
  static Future<List<Product>> getFavorites() async {
    try {
      final String? favoritesJson = await _storage.read(key: _favoritesKey);
      if (favoritesJson == null || favoritesJson.isEmpty) {
        return [];
      }

      final List<dynamic> decoded = jsonDecode(favoritesJson);
      return decoded.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  // Add to favorites
  static Future<void> addFavorite(Product product) async {
    try {
      final favorites = await getFavorites();

      // Check if already exists
      if (favorites.any((p) => p.id == product.id)) {
        return;
      }

      favorites.add(product);
      await _storage.write(
        key: _favoritesKey,
        value: jsonEncode(favorites.map((p) => p.toJson()).toList()),
      );
    } catch (e) {
      throw Exception('Failed to add favorite: $e');
    }
  }

  // Remove from favorites
  static Future<void> removeFavorite(String productId) async {
    try {
      final favorites = await getFavorites();
      favorites.removeWhere((p) => p.id == productId);
      await _storage.write(
        key: _favoritesKey,
        value: jsonEncode(favorites.map((p) => p.toJson()).toList()),
      );
    } catch (e) {
      throw Exception('Failed to remove favorite: $e');
    }
  }

  // Check if product is favorite
  static Future<bool> isFavorite(String productId) async {
    try {
      final favorites = await getFavorites();
      return favorites.any((p) => p.id == productId);
    } catch (e) {
      return false;
    }
  }

  // Toggle favorite
  static Future<bool> toggleFavorite(Product product) async {
    final isFav = await isFavorite(product.id);
    if (isFav) {
      await removeFavorite(product.id);
      return false;
    } else {
      await addFavorite(product);
      return true;
    }
  }
}
