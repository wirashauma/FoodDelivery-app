import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/core/constants/api_config.dart';

/// Service for handling deliverer verification status
class DelivererVerificationService {
  static final DelivererVerificationService _instance =
      DelivererVerificationService._internal();
  factory DelivererVerificationService() => _instance;
  DelivererVerificationService._internal();

  final _storage = const FlutterSecureStorage();

  /// Check if deliverer has completed all verification steps
  Future<VerificationStatus> checkVerificationStatus() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) {
        return VerificationStatus.notAuthenticated;
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/driver/verification-status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return VerificationStatus.fromJson(data['data'] ?? data);
      } else if (response.statusCode == 404) {
        // No driver profile exists yet
        return VerificationStatus.needsOnboarding;
      }

      return VerificationStatus.error;
    } catch (e) {
      print('Error checking verification status: $e');
      return VerificationStatus.error;
    }
  }

  /// Save verification step locally
  Future<void> saveVerificationStep(String step) async {
    await _storage.write(key: 'verification_step', value: step);
  }

  /// Get last saved verification step
  Future<String?> getLastVerificationStep() async {
    return await _storage.read(key: 'verification_step');
  }

  /// Clear verification data
  Future<void> clearVerificationData() async {
    await _storage.delete(key: 'verification_step');
  }
}

/// Verification status enum and data class
class VerificationStatus {
  final bool isRegistered;
  final bool hasCompletedOnboarding;
  final bool hasDriverProfile;
  final bool hasKTP;
  final bool hasSIM;
  final bool hasNPWP;
  final bool hasFaceVerification;
  final bool isFullyVerified;
  final String? verificationMessage;

  VerificationStatus({
    this.isRegistered = false,
    this.hasCompletedOnboarding = false,
    this.hasDriverProfile = false,
    this.hasKTP = false,
    this.hasSIM = false,
    this.hasNPWP = false,
    this.hasFaceVerification = false,
    this.isFullyVerified = false,
    this.verificationMessage,
  });

  static VerificationStatus get notAuthenticated => VerificationStatus(
        verificationMessage: 'Not authenticated',
      );

  static VerificationStatus get needsOnboarding => VerificationStatus(
        isRegistered: true,
        verificationMessage: 'Needs onboarding',
      );

  static VerificationStatus get error => VerificationStatus(
        verificationMessage: 'Error checking status',
      );

  factory VerificationStatus.fromJson(Map<String, dynamic> json) {
    return VerificationStatus(
      isRegistered: json['isRegistered'] ?? false,
      hasCompletedOnboarding: json['hasCompletedOnboarding'] ?? false,
      hasDriverProfile: json['hasDriverProfile'] ?? false,
      hasKTP: json['hasKTP'] ?? false,
      hasSIM: json['hasSIM'] ?? false,
      hasNPWP: json['hasNPWP'] ?? false,
      hasFaceVerification: json['hasFaceVerification'] ?? false,
      isFullyVerified: json['isFullyVerified'] ?? false,
      verificationMessage: json['message'],
    );
  }

  /// Determine which step the user should be on
  String get currentStep {
    if (!hasDriverProfile) return 'registration';
    if (!hasKTP || !hasSIM) return 'documents';
    if (!hasFaceVerification) return 'face';
    return 'complete';
  }
}
