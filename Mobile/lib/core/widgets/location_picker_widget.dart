import 'package:flutter/material.dart';
import 'package:titipin_app/data/services/location_service.dart';

/// Widget for picking delivery location with geolocation support
class LocationPickerWidget extends StatefulWidget {
  final Function(LocationData) onLocationSelected;
  final LocationData? initialLocation;
  final String? hint;

  const LocationPickerWidget({
    super.key,
    required this.onLocationSelected,
    this.initialLocation,
    this.hint,
  });

  @override
  State<LocationPickerWidget> createState() => _LocationPickerWidgetState();
}

class _LocationPickerWidgetState extends State<LocationPickerWidget> {
  final LocationService _locationService = LocationService();
  final TextEditingController _addressController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;
  LocationData? _selectedLocation;

  @override
  void initState() {
    super.initState();
    if (widget.initialLocation != null) {
      _selectedLocation = widget.initialLocation;
      _addressController.text = widget.initialLocation!.address ?? '';
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
      _errorMessage = null;
    });

    try {
      final position = await _locationService.getCurrentPosition();
      if (position == null) {
        throw LocationException('Tidak dapat mendapatkan lokasi');
      }

      final address = await _locationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );

      final locationData = LocationData(
        latitude: position.latitude,
        longitude: position.longitude,
        address: address,
      );

      setState(() {
        _selectedLocation = locationData;
        _addressController.text = address ?? '';
        _isLoading = false;
      });

      widget.onLocationSelected(locationData);
    } on LocationException catch (e) {
      setState(() {
        _errorMessage = e.message;
        _isLoading = false;
      });
      _showLocationError(e.message);
    } catch (e) {
      setState(() {
        _errorMessage = 'Gagal mendapatkan lokasi: $e';
        _isLoading = false;
      });
    }
  }

  void _showLocationError(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.location_off, color: Colors.red),
            SizedBox(width: 8),
            Text('Lokasi Tidak Tersedia'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            const SizedBox(height: 16),
            const Text(
              'Pastikan:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('• Layanan lokasi aktif'),
            const Text('• Izin lokasi diberikan'),
            const Text('• GPS dalam kondisi baik'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tutup'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _locationService.openLocationSettings();
            },
            child: const Text('Buka Pengaturan'),
          ),
        ],
      ),
    );
  }

  Future<void> _searchAddress() async {
    final address = _addressController.text.trim();
    if (address.isEmpty) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final location =
          await _locationService.getCoordinatesFromAddress(address);
      if (location == null) {
        throw LocationException('Alamat tidak ditemukan');
      }

      // Get full address
      final fullAddress = await _locationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude,
      );

      final locationData = LocationData(
        latitude: location.latitude,
        longitude: location.longitude,
        address: fullAddress ?? address,
      );

      setState(() {
        _selectedLocation = locationData;
        _addressController.text = fullAddress ?? address;
        _isLoading = false;
      });

      widget.onLocationSelected(locationData);
    } on LocationException catch (e) {
      setState(() {
        _errorMessage = e.message;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Gagal mencari alamat: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Address input with search
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _addressController,
                decoration: InputDecoration(
                  hintText: widget.hint ?? 'Masukkan alamat pengiriman',
                  prefixIcon: const Icon(Icons.location_on_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: isTablet ? 16 : 12,
                  ),
                ),
                onSubmitted: (_) => _searchAddress(),
              ),
            ),
            const SizedBox(width: 8),

            // Search button
            IconButton(
              onPressed: _isLoading ? null : _searchAddress,
              icon: const Icon(Icons.search),
              style: IconButton.styleFrom(
                backgroundColor: Colors.grey[200],
                padding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Get current location button
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _isLoading ? null : _getCurrentLocation,
            icon: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.my_location),
            label: Text(
              _isLoading ? 'Mencari lokasi...' : 'Gunakan Lokasi Saat Ini',
              style: TextStyle(fontSize: isTablet ? 16 : 14),
            ),
            style: OutlinedButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: isTablet ? 16 : 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),

        // Error message
        if (_errorMessage != null) ...[
          const SizedBox(height: 8),
          Text(
            _errorMessage!,
            style: const TextStyle(color: Colors.red, fontSize: 12),
          ),
        ],

        // Selected location preview
        if (_selectedLocation != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green[700], size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lokasi Dipilih',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Colors.green[700],
                          fontSize: isTablet ? 16 : 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _selectedLocation!.address ??
                            '${_selectedLocation!.latitude.toStringAsFixed(6)}, ${_selectedLocation!.longitude.toStringAsFixed(6)}',
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: isTablet ? 14 : 12,
                        ),
                      ),
                    ],
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

/// Compact location picker for quick selection
class CompactLocationPicker extends StatefulWidget {
  final Function(LocationData) onLocationSelected;
  final LocationData? initialLocation;

  const CompactLocationPicker({
    super.key,
    required this.onLocationSelected,
    this.initialLocation,
  });

  @override
  State<CompactLocationPicker> createState() => _CompactLocationPickerState();
}

class _CompactLocationPickerState extends State<CompactLocationPicker> {
  final LocationService _locationService = LocationService();
  bool _isLoading = false;
  LocationData? _location;

  @override
  void initState() {
    super.initState();
    _location = widget.initialLocation;
  }

  Future<void> _getLocation() async {
    setState(() => _isLoading = true);

    try {
      final position = await _locationService.getCurrentPosition();
      if (position == null) throw LocationException('Lokasi tidak tersedia');

      final address = await _locationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );

      final locationData = LocationData(
        latitude: position.latitude,
        longitude: position.longitude,
        address: address,
      );

      setState(() {
        _location = locationData;
        _isLoading = false;
      });

      widget.onLocationSelected(locationData);
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mendapatkan lokasi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _isLoading ? null : _getLocation,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _location != null ? Colors.green[100] : Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(
                      _location != null
                          ? Icons.check_circle
                          : Icons.my_location,
                      color: _location != null
                          ? Colors.green[700]
                          : Colors.grey[600],
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _location != null ? 'Lokasi Terdeteksi' : 'Tambah Lokasi',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: _location != null
                          ? Colors.green[700]
                          : Colors.grey[700],
                    ),
                  ),
                  if (_location?.address != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _location!.address!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ] else ...[
                    const SizedBox(height: 4),
                    Text(
                      'Ketuk untuk menggunakan lokasi saat ini',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }
}
