import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  // Environment from .env file
  static String get environment => dotenv.env['APP_ENVIRONMENT'] ?? 'dev';

  // Base URLs from .env file
  static String get devBaseUrl =>
      dotenv.env['DEV_API_BASE_URL'] ?? 'http://localhost:3000/api';
  static String get prodBaseUrl =>
      dotenv.env['PROD_API_BASE_URL'] ?? 'https://api.titipin.com/api';

  // Socket URLs from .env file
  static String get devSocketUrl =>
      dotenv.env['DEV_SOCKET_URL'] ?? 'http://localhost:3000';
  static String get prodSocketUrl =>
      dotenv.env['PROD_SOCKET_URL'] ?? 'https://api.titipin.com';

  // Get current base URL
  static String get baseUrl => environment == 'prod' ? prodBaseUrl : devBaseUrl;

  // Get current socket URL
  static String get socketUrl =>
      environment == 'prod' ? prodSocketUrl : devSocketUrl;

  // Auth endpoints
  static String get loginEndpoint => '$baseUrl/auth/login';
  static String get registerEndpoint => '$baseUrl/auth/register';
  static String get refreshTokenEndpoint => '$baseUrl/auth/refresh';
  static String get logoutEndpoint => '$baseUrl/auth/logout';
  static String get forgotPasswordEndpoint => '$baseUrl/auth/forgot-password';
  static String get resetPasswordEndpoint => '$baseUrl/auth/reset-password';

  // User endpoints
  static String get profileEndpoint => '$baseUrl/users/profile';
  static String get updateProfileEndpoint => '$baseUrl/users/profile';

  // Product endpoints
  static String get productsEndpoint => '$baseUrl/products';
  static String get categoriesEndpoint => '$baseUrl/categories';

  // Cart endpoints
  static String get cartEndpoint => '$baseUrl/cart';

  // Order endpoints
  static String get ordersEndpoint => '$baseUrl/orders';
  static String get createOrderEndpoint => '$baseUrl/orders';
  static String get myOrdersEndpoint => '$baseUrl/orders/my';
  static String get availableOrdersEndpoint => '$baseUrl/orders/available';

  // Deliverer endpoints
  static String get delivererDashboardEndpoint =>
      '$baseUrl/deliverer/dashboard';
  static String get delivererActiveOrdersEndpoint =>
      '$baseUrl/deliverer/orders/active';
  static String get delivererStatusEndpoint => '$baseUrl/driver/status';
  static String get delivererInfoEndpoint => '$baseUrl/driver/register';
  static String get uploadDocumentsEndpoint => '$baseUrl/driver/documents';
  static String get uploadSelfieEndpoint => '$baseUrl/driver/face-verification';
  static String get submitVerificationEndpoint =>
      '$baseUrl/driver/face-verification';
  static String get verificationStatusEndpoint =>
      '$baseUrl/driver/verification-status';

  // Message endpoints
  static String get messagesEndpoint => '$baseUrl/messages';

  // Complaint endpoints
  static String get complaintsEndpoint => '$baseUrl/complaints';

  // Rating endpoints
  static String get ratingsEndpoint => '$baseUrl/ratings';

  // Request timeout from .env file
  static Duration get requestTimeout => Duration(
        seconds:
            int.tryParse(dotenv.env['REQUEST_TIMEOUT_SECONDS'] ?? '30') ?? 30,
      );
}
