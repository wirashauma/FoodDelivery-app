import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:titipin_app/features/auth/screens/welcome_screen.dart';
import 'package:titipin_app/features/home/screens/main_screen.dart';
import 'package:titipin_app/features/deliverer/screens/deliverer_main_screen.dart';
import 'package:titipin_app/features/deliverer/onboarding/deliverer_onboarding_screen.dart';
import 'package:titipin_app/features/deliverer/onboarding/deliverer_registration_screen.dart';
import 'package:titipin_app/features/deliverer/onboarding/document_scan_screen.dart';
import 'package:titipin_app/features/deliverer/onboarding/face_verification_screen.dart';
import 'package:titipin_app/features/deliverer/services/verification_service.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final _storage = const FlutterSecureStorage();
  final _verificationService = DelivererVerificationService();
  Future<AuthResult>? _authFuture;

  @override
  void initState() {
    super.initState();
    _authFuture = _checkAuthAndVerification();
  }

  Future<AuthResult> _checkAuthAndVerification() async {
    try {
      final token = await _storage.read(key: 'accessToken');

      // No token or expired
      if (token == null || JwtDecoder.isExpired(token)) {
        await _storage.deleteAll();
        return AuthResult(status: AuthStatus.notAuthenticated);
      }

      // Decode token
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      final role =
          decodedToken['user']['role']?.toString().toUpperCase() ?? 'USER';

      // For regular users, go directly to main screen
      if (role != 'DELIVERER') {
        return AuthResult(status: AuthStatus.authenticatedUser);
      }

      // For deliverers, check verification status
      final verificationStatus =
          await _verificationService.checkVerificationStatus();

      if (verificationStatus.isFullyVerified) {
        return AuthResult(status: AuthStatus.authenticatedDeliverer);
      }

      // Check which step deliverer needs to complete
      switch (verificationStatus.currentStep) {
        case 'registration':
          // Check if first time (needs onboarding) or returning
          final lastStep = await _verificationService.getLastVerificationStep();
          if (lastStep == null) {
            return AuthResult(status: AuthStatus.needsOnboarding);
          }
          return AuthResult(status: AuthStatus.needsRegistration);
        case 'documents':
          return AuthResult(status: AuthStatus.needsDocuments);
        case 'face':
          return AuthResult(status: AuthStatus.needsFaceVerification);
        default:
          return AuthResult(status: AuthStatus.authenticatedDeliverer);
      }
    } catch (e) {
      debugPrint("Error in auth check: $e");
      await _storage.deleteAll();
      return AuthResult(status: AuthStatus.notAuthenticated);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AuthResult>(
      future: _authFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Memeriksa status akun...'),
                ],
              ),
            ),
          );
        }

        final result =
            snapshot.data ?? AuthResult(status: AuthStatus.notAuthenticated);

        switch (result.status) {
          case AuthStatus.authenticatedUser:
            return const MainScreen();
          case AuthStatus.authenticatedDeliverer:
            return const DelivererMainScreen();
          case AuthStatus.needsOnboarding:
            return const DelivererOnboardingScreen();
          case AuthStatus.needsRegistration:
            return const DelivererRegistrationScreen();
          case AuthStatus.needsDocuments:
            return const DocumentScanScreen();
          case AuthStatus.needsFaceVerification:
            return const FaceVerificationScreen();
          case AuthStatus.notAuthenticated:
            return const WelcomeScreen();
        }
      },
    );
  }
}

enum AuthStatus {
  notAuthenticated,
  authenticatedUser,
  authenticatedDeliverer,
  needsOnboarding,
  needsRegistration,
  needsDocuments,
  needsFaceVerification,
}

class AuthResult {
  final AuthStatus status;
  final String? message;

  AuthResult({required this.status, this.message});
}
