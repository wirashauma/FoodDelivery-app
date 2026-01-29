import 'package:flutter/material.dart';

/// Responsive wrapper widget that adapts layout based on screen size
class ResponsiveWrapper extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveWrapper({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < 600;

  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= 600 &&
      MediaQuery.of(context).size.width < 1200;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1200;

  static double screenWidth(BuildContext context) =>
      MediaQuery.of(context).size.width;

  static double screenHeight(BuildContext context) =>
      MediaQuery.of(context).size.height;

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;

    if (size.width >= 1200 && desktop != null) {
      return desktop!;
    } else if (size.width >= 600 && tablet != null) {
      return tablet!;
    }
    return mobile;
  }
}

/// Responsive padding based on screen size
class ResponsivePadding extends StatelessWidget {
  final Widget child;
  final EdgeInsets? mobilePadding;
  final EdgeInsets? tabletPadding;

  const ResponsivePadding({
    super.key,
    required this.child,
    this.mobilePadding,
    this.tabletPadding,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    EdgeInsets padding;

    if (width >= 600) {
      padding = tabletPadding ??
          const EdgeInsets.symmetric(horizontal: 48, vertical: 24);
    } else {
      padding = mobilePadding ??
          const EdgeInsets.symmetric(horizontal: 20, vertical: 16);
    }

    return Padding(padding: padding, child: child);
  }
}

/// Responsive text size
class ResponsiveText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final double mobileSize;
  final double tabletSize;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const ResponsiveText({
    super.key,
    required this.text,
    this.style,
    this.mobileSize = 14,
    this.tabletSize = 16,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final fontSize = width >= 600 ? tabletSize : mobileSize;

    return Text(
      text,
      style: (style ?? const TextStyle()).copyWith(fontSize: fontSize),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

/// Extension for responsive sizing
extension ResponsiveExtension on BuildContext {
  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;
  bool get isMobile => screenWidth < 600;
  bool get isTablet => screenWidth >= 600 && screenWidth < 1200;
  bool get isDesktop => screenWidth >= 1200;

  /// Returns responsive value based on screen size
  T responsive<T>({required T mobile, T? tablet, T? desktop}) {
    if (isDesktop && desktop != null) return desktop;
    if (isTablet && tablet != null) return tablet;
    return mobile;
  }

  /// Returns responsive padding
  EdgeInsets get responsivePadding {
    if (isTablet)
      return const EdgeInsets.symmetric(horizontal: 48, vertical: 24);
    return const EdgeInsets.symmetric(horizontal: 20, vertical: 16);
  }
}
