import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationService {
  static Future<Position> getCurrentPosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Layanan lokasi tidak aktif');
    }

    // Check permission
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Izin lokasi ditolak');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception(
          'Izin lokasi ditolak permanen. Aktifkan di pengaturan perangkat.');
    }

    // Get current position
    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  static Future<String> getAddressFromCoordinates(
    double latitude,
    double longitude,
  ) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        latitude,
        longitude,
      );

      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        final parts = <String>[];

        if (placemark.street != null && placemark.street!.isNotEmpty) {
          parts.add(placemark.street!);
        }
        if (placemark.subLocality != null &&
            placemark.subLocality!.isNotEmpty) {
          parts.add(placemark.subLocality!);
        }
        if (placemark.locality != null && placemark.locality!.isNotEmpty) {
          parts.add(placemark.locality!);
        }
        if (placemark.subAdministrativeArea != null &&
            placemark.subAdministrativeArea!.isNotEmpty) {
          parts.add(placemark.subAdministrativeArea!);
        }
        if (placemark.administrativeArea != null &&
            placemark.administrativeArea!.isNotEmpty) {
          parts.add(placemark.administrativeArea!);
        }
        if (placemark.postalCode != null && placemark.postalCode!.isNotEmpty) {
          parts.add(placemark.postalCode!);
        }

        return parts.join(', ');
      }
      return 'Alamat tidak ditemukan';
    } catch (e) {
      return 'Gagal mendapatkan alamat';
    }
  }

  static Future<List<Location>> getCoordinatesFromAddress(
      String address) async {
    try {
      return await locationFromAddress(address);
    } catch (e) {
      throw Exception('Alamat tidak ditemukan');
    }
  }

  static double calculateDistance(
    double startLatitude,
    double startLongitude,
    double endLatitude,
    double endLongitude,
  ) {
    return Geolocator.distanceBetween(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    );
  }

  static String formatDistance(double distanceInMeters) {
    if (distanceInMeters < 1000) {
      return '${distanceInMeters.toStringAsFixed(0)} m';
    } else {
      final km = distanceInMeters / 1000;
      return '${km.toStringAsFixed(1)} km';
    }
  }
}
