class ApiConfig {
  // Environment: 'dev' or 'prod'
  static const String environment = 'dev';

  // Base URLs
  static const String devBaseUrl = 'http://192.168.1.18:3000/api';
  static const String prodBaseUrl = 'https://api.titipin.com/api';

  // Socket URLs
  static const String devSocketUrl = 'http://192.168.1.18:3000';
  static const String prodSocketUrl = 'https://api.titipin.com';

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
  static String get delivererStatusEndpoint => '$baseUrl/deliverer/status';
  static String get delivererInfoEndpoint => '$baseUrl/deliverer/info';
  static String get uploadDocumentsEndpoint => '$baseUrl/deliverer/documents';
  static String get uploadSelfieEndpoint => '$baseUrl/deliverer/selfie';
  static String get submitVerificationEndpoint =>
      '$baseUrl/deliverer/submit-verification';
  static String get verificationStatusEndpoint =>
      '$baseUrl/deliverer/verification-status';

  // Message endpoints
  static String get messagesEndpoint => '$baseUrl/messages';

  // Complaint endpoints
  static String get complaintsEndpoint => '$baseUrl/complaints';

  // Rating endpoints
  static String get ratingsEndpoint => '$baseUrl/ratings';

  // Request timeout
  static const Duration requestTimeout = Duration(seconds: 30);
}
