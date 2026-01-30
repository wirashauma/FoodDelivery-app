import 'package:flutter/material.dart';
import 'package:titipin_app/services/location_service.dart';
import 'package:titipin_app/config/colors.dart';

class LocationPickerWidget extends StatefulWidget {
  final Function(double latitude, double longitude, String address)
      onLocationSelected;
  final double? initialLatitude;
  final double? initialLongitude;
  final String? initialAddress;

  const LocationPickerWidget({
    super.key,
    required this.onLocationSelected,
    this.initialLatitude,
    this.initialLongitude,
    this.initialAddress,
  });

  @override
  State<LocationPickerWidget> createState() => _LocationPickerWidgetState();
}

class _LocationPickerWidgetState extends State<LocationPickerWidget> {
  final TextEditingController _addressController = TextEditingController();
  double? _latitude;
  double? _longitude;
  String? _address;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _latitude = widget.initialLatitude;
    _longitude = widget.initialLongitude;
    _address = widget.initialAddress;
    if (_address != null) {
      _addressController.text = _address!;
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final position = await LocationService.getCurrentPosition();
      final address = await LocationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );

      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _address = address;
        _addressController.text = address;
      });

      widget.onLocationSelected(_latitude!, _longitude!, _address!);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _searchAddress() async {
    if (_addressController.text.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final locations = await LocationService.getCoordinatesFromAddress(
        _addressController.text,
      );

      if (locations.isNotEmpty) {
        final location = locations.first;
        final address = await LocationService.getAddressFromCoordinates(
          location.latitude,
          location.longitude,
        );

        setState(() {
          _latitude = location.latitude;
          _longitude = location.longitude;
          _address = address;
          _addressController.text = address;
        });

        widget.onLocationSelected(_latitude!, _longitude!, _address!);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _addressController,
                decoration: InputDecoration(
                  hintText: 'Cari alamat...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                onSubmitted: (_) => _searchAddress(),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _isLoading ? null : _getCurrentLocation,
              icon: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location),
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ),
        if (_latitude != null && _longitude != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.location_on,
                  color: AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _address ?? 'Lokasi dipilih',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
