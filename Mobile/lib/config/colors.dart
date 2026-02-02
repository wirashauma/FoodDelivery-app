import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors - Red/Pink theme matching reference design
  static const Color primary = Color(0xFFE53935);
  static const Color primaryDark = Color(0xFFC62828);
  static const Color primaryLight = Color(0xFFFFCDD2);
  static const Color primarySoft = Color(0xFFFFF0F0);

  // Secondary Colors
  static const Color secondary = Color(0xFFFF6B6B);
  static const Color secondaryDark = Color(0xFFE53935);
  static const Color secondaryLight = Color(0xFFFFABAB);

  // Accent Colors
  static const Color accent = Color(0xFFFF4757);
  static const Color accentLight = Color(0xFFFFE4E6);

  // Neutral Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey200 = Color(0xFFEEEEEE);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey400 = Color(0xFFBDBDBD);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey600 = Color(0xFF757575);
  static const Color grey700 = Color(0xFF616161);
  static const Color grey800 = Color(0xFF424242);
  static const Color grey900 = Color(0xFF212121);

  // Semantic Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color successLight = Color(0xFFE8F5E9);
  static const Color error = Color(0xFFF44336);
  static const Color errorLight = Color(0xFFFFEBEE);
  static const Color warning = Color(0xFFFFC107);
  static const Color warningLight = Color(0xFFFFF8E1);
  static const Color info = Color(0xFF2196F3);
  static const Color infoLight = Color(0xFFE3F2FD);

  // Background Colors
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  static const Color scaffoldBackground = Color(0xFFFFFBFB);

  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);
  static const Color textDisabled = Color(0xFFBDBDBD);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Border Colors
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);
  static const Color borderLight = Color(0xFFFCE4EC);

  // Shadow Colors
  static Color shadow = Colors.black.withValues(alpha: 0.1);

  // Status Colors
  static const Color pending = Color(0xFFFFA726);
  static const Color processing = Color(0xFF42A5F5);
  static const Color completed = Color(0xFF66BB6A);
  static const Color cancelled = Color(0xFFEF5350);

  // Rating Colors
  static const Color starActive = Color(0xFFFFB800);
  static const Color starInactive = Color(0xFFE0E0E0);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, Color(0xFFFF6B6B)],
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [secondary, secondaryLight],
  );

  static const LinearGradient promoGradient = LinearGradient(
    colors: [Color(0xFFE53935), Color(0xFFFF6B6B)],
  );
}
