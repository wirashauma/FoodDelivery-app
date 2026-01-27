/// API Configuration for Titipin Mobile App
///
/// This file centralizes all API-related configurations.
/// Change the baseUrl here to update all API calls throughout the app.

class ApiConfig {
  // ===========================================
  // ENVIRONMENT CONFIGURATION
  // ===========================================

  /// Set to true for production, false for development
  static const bool isProduction = false;

  // ===========================================
  // API BASE URLs
  // ===========================================

  /// Development API URL
  /// - For Android Emulator: use 10.0.2.2 (localhost alias)
  /// - For iOS Simulator: use localhost or 127.0.0.1
  /// - For Physical Device: use your computer's local IP
  static const String _devBaseUrl = 'http://192.168.1.4:3000/api';

  /// Production API URL (your deployed backend)
  static const String _prodBaseUrl = 'https://api.titipin.com/api';

  /// Current API Base URL based on environment
  static String get baseUrl => isProduction ? _prodBaseUrl : _devBaseUrl;

  // ===========================================
  // WEBSOCKET CONFIGURATION
  // ===========================================

  /// Development WebSocket URL
  static const String _devSocketUrl = 'http://192.168.1.4:3000';

  /// Production WebSocket URL
  static const String _prodSocketUrl = 'https://api.titipin.com';

  /// Current WebSocket URL based on environment
  static String get socketUrl => isProduction ? _prodSocketUrl : _devSocketUrl;

  // ===========================================
  // API ENDPOINTS
  // ===========================================

  // Auth Endpoints
  static String get loginEndpoint => '$baseUrl/auth/login';
  static String get registerEndpoint => '$baseUrl/auth/register';
  static String get logoutEndpoint => '$baseUrl/auth/logout';

  // Profile Endpoints
  static String get profileEndpoint => '$baseUrl/profile/me';
  static String get updateProfileEndpoint => '$baseUrl/profile/update';

  // Products Endpoints
  static String get productsEndpoint => '$baseUrl/products';
  static String productDetailEndpoint(int id) => '$baseUrl/products/$id';

  // Orders Endpoints
  static String get ordersEndpoint => '$baseUrl/orders';
  static String get myOrdersEndpoint => '$baseUrl/orders/my-history';
  static String get availableOrdersEndpoint => '$baseUrl/orders/available';
  static String get myActiveJobsEndpoint => '$baseUrl/orders/my-active-jobs';
  static String orderDetailEndpoint(int id) => '$baseUrl/orders/$id';
  static String orderOffersEndpoint(int id) => '$baseUrl/orders/$id/offers';
  static String orderUpdateStatusEndpoint(int id) =>
      '$baseUrl/orders/$id/update-status';
  static String orderAcceptEndpoint(int id) => '$baseUrl/orders/$id/accept';
  static String orderRejectEndpoint(int id) => '$baseUrl/orders/$id/reject';

  // Offers Endpoints
  static String get offersEndpoint => '$baseUrl/offers';
  static String offerAcceptEndpoint(int id) => '$baseUrl/offers/$id/accept';

  // Deliverer Endpoints
  static String get delivererStatsEndpoint =>
      '$baseUrl/orders/deliverer/dashboard/stats';
  static String get delivererActiveEndpoint =>
      '$baseUrl/orders/deliverer/active';
  static String delivererCompletedEndpoint({int limit = 10, int offset = 0}) =>
      '$baseUrl/orders/deliverer/completed?limit=$limit&offset=$offset';

  // Chat Endpoints
  static String get chatsEndpoint => '$baseUrl/chats';
  static String get chatListEndpoint => '$baseUrl/chats/my-list';
  static String chatMessagesEndpoint(int orderId) =>
      '$baseUrl/chats/$orderId/messages';

  // ===========================================
  // TIMEOUTS
  // ===========================================

  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
