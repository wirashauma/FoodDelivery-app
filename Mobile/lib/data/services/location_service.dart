import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

/// Location service for handling geolocation features
class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Request location permission
  Future<LocationPermission> requestPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    return permission;
  }

  /// Check if permission is granted
  Future<bool> hasPermission() async {
    final permission = await Geolocator.checkPermission();
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  /// Get current position
  Future<Position?> getCurrentPosition({
    LocationAccuracy accuracy = LocationAccuracy.high,
  }) async {
    try {
      final serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw LocationException('Location services are disabled');
      }

      final permission = await requestPermission();
      if (permission == LocationPermission.denied) {
        throw LocationException('Location permission denied');
      }
      if (permission == LocationPermission.deniedForever) {
        throw LocationException('Location permission permanently denied');
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: accuracy,
        timeLimit: const Duration(seconds: 15),
      );
    } catch (e) {
      if (e is LocationException) rethrow;
      throw LocationException('Failed to get location: $e');
    }
  }

  /// Get address from coordinates
  Future<String?> getAddressFromCoordinates(
      double latitude, double longitude) async {
    try {
      final placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        return _formatAddress(place);
      }
      return null;
    } catch (e) {
      throw LocationException('Failed to get address: $e');
    }
  }

  /// Get coordinates from address
  Future<Location?> getCoordinatesFromAddress(String address) async {
    try {
      final locations = await locationFromAddress(address);
      if (locations.isNotEmpty) {
        return locations.first;
      }
      return null;
    } catch (e) {
      throw LocationException('Failed to get coordinates: $e');
    }
  }

  /// Format placemark to readable address
  String _formatAddress(Placemark place) {
    final parts = <String>[];

    if (place.street != null && place.street!.isNotEmpty) {
      parts.add(place.street!);
    }
    if (place.subLocality != null && place.subLocality!.isNotEmpty) {
      parts.add(place.subLocality!);
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      parts.add(place.locality!);
    }
    if (place.subAdministrativeArea != null &&
        place.subAdministrativeArea!.isNotEmpty) {
      parts.add(place.subAdministrativeArea!);
    }
    if (place.administrativeArea != null &&
        place.administrativeArea!.isNotEmpty) {
      parts.add(place.administrativeArea!);
    }
    if (place.postalCode != null && place.postalCode!.isNotEmpty) {
      parts.add(place.postalCode!);
    }

    return parts.join(', ');
  }

  /// Calculate distance between two points (in meters)
  double calculateDistance(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  /// Open location settings
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }

  /// Open app settings
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }
}

/// Custom exception for location errors
class LocationException implements Exception {
  final String message;
  LocationException(this.message);

  @override
  String toString() => message;
}

/// Location data model
class LocationData {
  final double latitude;
  final double longitude;
  final String? address;
  final DateTime timestamp;

  LocationData({
    required this.latitude,
    required this.longitude,
    this.address,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'address': address,
        'timestamp': timestamp.toIso8601String(),
      };

  factory LocationData.fromJson(Map<String, dynamic> json) => LocationData(
        latitude: json['latitude']?.toDouble() ?? 0.0,
        longitude: json['longitude']?.toDouble() ?? 0.0,
        address: json['address'],
        timestamp: json['timestamp'] != null
            ? DateTime.parse(json['timestamp'])
            : DateTime.now(),
      );
}
