import 'dart:io';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service for handling file uploads to Supabase Storage
class SupabaseStorageService {
  static SupabaseStorageService? _instance;
  static SupabaseClient? _supabaseClient;

  // Supabase configuration from .env file
  static String get _supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? 'https://your-project.supabase.co';
  static String get _supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';

  // Storage bucket names
  static const String documentsBucket = 'documents';
  static const String productsBucket = 'products';
  static const String restaurantsBucket = 'restaurants';
  static const String profilesBucket = 'profiles';

  SupabaseStorageService._();

  static SupabaseStorageService get instance {
    _instance ??= SupabaseStorageService._();
    return _instance!;
  }

  /// Initialize Supabase client
  static Future<void> initialize() async {
    try {
      await Supabase.initialize(
        url: _supabaseUrl,
        anonKey: _supabaseAnonKey,
      );
      _supabaseClient = Supabase.instance.client;
    } catch (e) {
      // Supabase might already be initialized
      _supabaseClient = Supabase.instance.client;
    }
  }

  /// Get Supabase client
  SupabaseClient? get client => _supabaseClient;

  /// Upload file to Supabase Storage
  /// Returns the public URL of the uploaded file
  Future<String?> uploadFile({
    required File file,
    required String bucket,
    required String fileName,
    String? folder,
  }) async {
    if (_supabaseClient == null) {
      await initialize();
    }

    if (_supabaseClient == null) {
      throw Exception('Supabase client not initialized');
    }

    try {
      final bytes = await file.readAsBytes();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final uniqueFileName = '${timestamp}_$fileName';
      final filePath =
          folder != null ? '$folder/$uniqueFileName' : uniqueFileName;

      // Upload file
      await _supabaseClient!.storage.from(bucket).uploadBinary(
            filePath,
            bytes,
            fileOptions: const FileOptions(
              upsert: true,
            ),
          );

      // Get public URL
      final publicUrl =
          _supabaseClient!.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (e) {
      rethrow;
    }
  }

  /// Upload document (KTP, SIM, NPWP, Face)
  Future<String?> uploadDocument({
    required File file,
    required String documentType,
    required int userId,
  }) async {
    final extension = file.path.split('.').last;
    final fileName = '${documentType}_$userId.$extension';

    return uploadFile(
      file: file,
      bucket: documentsBucket,
      fileName: fileName,
      folder: documentType.toLowerCase(),
    );
  }

  /// Upload product image
  Future<String?> uploadProductImage({
    required File file,
    int? productId,
  }) async {
    final extension = file.path.split('.').last;
    final fileName = 'product_${productId ?? 'new'}.$extension';

    return uploadFile(
      file: file,
      bucket: productsBucket,
      fileName: fileName,
    );
  }

  /// Upload restaurant image
  Future<String?> uploadRestaurantImage({
    required File file,
    int? restaurantId,
  }) async {
    final extension = file.path.split('.').last;
    final fileName = 'restaurant_${restaurantId ?? 'new'}.$extension';

    return uploadFile(
      file: file,
      bucket: restaurantsBucket,
      fileName: fileName,
    );
  }

  /// Upload profile picture
  Future<String?> uploadProfilePicture({
    required File file,
    required int userId,
  }) async {
    final extension = file.path.split('.').last;
    final fileName = 'profile_$userId.$extension';

    return uploadFile(
      file: file,
      bucket: profilesBucket,
      fileName: fileName,
    );
  }

  /// Delete file from storage
  Future<bool> deleteFile({
    required String bucket,
    required String filePath,
  }) async {
    if (_supabaseClient == null) {
      return false;
    }

    try {
      await _supabaseClient!.storage.from(bucket).remove([filePath]);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Get public URL for a file
  String? getPublicUrl({
    required String bucket,
    required String filePath,
  }) {
    if (_supabaseClient == null) {
      return null;
    }

    return _supabaseClient!.storage.from(bucket).getPublicUrl(filePath);
  }
}
