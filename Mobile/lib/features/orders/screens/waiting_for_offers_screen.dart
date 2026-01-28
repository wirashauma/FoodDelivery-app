import 'dart:async';
import 'package:flutter/material.dart';
import 'package:titipin_app/features/chat/screens/chat_screen.dart';
import 'package:http/http.dart' as http; // <-- [MODIFIKASI]
import 'dart:convert'; // <-- [MODIFIKASI]
import 'package:flutter_secure_storage/flutter_secure_storage.dart'; // <-- [MODIFIKASI]
import 'package:titipin_app/features/auth/screens/auth_gate.dart'; // <-- [MODIFIKASI]
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class WaitingForOffersScreen extends StatefulWidget {
  final String orderId;

  const WaitingForOffersScreen({super.key, required this.orderId});

  @override
  State<WaitingForOffersScreen> createState() => _WaitingForOffersScreenState();
}

class _WaitingForOffersScreenState extends State<WaitingForOffersScreen> {
  bool _isAccepting = false;
  final _storage = const FlutterSecureStorage(); // <-- [MODIFIKASI]
  String _currentUserId = ''; // <-- [MODIFIKASI]

  // [MODIFIKASI]: Mengganti Stream simulasi dengan Future
  late Future<List<dynamic>> _offersFuture;

  @override
  void initState() {
    super.initState();
    _offersFuture = _fetchOffers(); // Panggil API
  }

  // [MODIFIKASI]: Fungsi baru untuk mengambil tawaran dari API
  Future<List<dynamic>> _fetchOffers() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    // Ambil User ID dari token
    try {
      final payload = JwtDecoder.decode(token);
      _currentUserId = payload['user']['id']?.toString() ?? '';
    } catch (e) {
      throw Exception('Token tidak valid');
    }

    final url =
        Uri.parse(ApiConfig.orderOffersEndpoint(int.parse(widget.orderId)));
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    } else {
      throw Exception('Gagal memuat tawaran: ${response.body}');
    }
  }

  // [MODIFIKASI]: Fungsi refresh
  void _refreshOffers() {
    setState(() {
      _offersFuture = _fetchOffers();
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  // [MODIFIKASI]: Fungsi _acceptOffer diubah total
  Future<void> _acceptOffer(Map<String, dynamic> offerData) async {
    if (_isAccepting) return;
    setState(() {
      _isAccepting = true;
    });

    final int offerId = offerData['id'];
    final String delivererId = offerData['deliverer_id'].toString();
    final String delivererName = offerData['deliverer']['nama'] ?? 'Deliverer';

    final token = await _storage.read(key: 'accessToken');
    final url = Uri.parse(ApiConfig.offerAcceptEndpoint(offerId));

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200 && mounted) {
        // Sukses! Arahkan ke ChatScreen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              orderId: widget.orderId,
              delivererId: delivererId,
              otherUserName: delivererName,
              currentUserId: _currentUserId,
            ),
          ),
        );
      } else if (mounted) {
        final error = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menerima tawaran: ${error['error']}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isAccepting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Tawaran untuk Order #${widget.orderId}"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Kembali ke AuthGate agar me-refresh riwayat pesanan
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (context) => const AuthGate()),
              (route) => false,
            );
          },
        ),
      ),
      // [MODIFIKASI]: Hapus FutureBuilder order
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.timer_outlined, size: 80, color: Colors.grey),
              const SizedBox(height: 20),
              const Text(
                "Pesanan Anda Telah Dibuat!",
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              const Text(
                "Harap tunggu, para deliverer akan segera memberikan penawaran ongkos kirim. Tarik ke bawah untuk refresh.",
                style: TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              const Text("Tawaran Masuk:",
                  style: TextStyle(fontWeight: FontWeight.bold)),
              Expanded(
                // [MODIFIKASI]: Ganti StreamBuilder menjadi FutureBuilder
                child: FutureBuilder<List<dynamic>>(
                  future: _offersFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Center(child: Text("Error: ${snapshot.error}"));
                    }
                    if (!snapshot.hasData || snapshot.data!.isEmpty) {
                      return const Center(
                          child:
                              Text("Belum ada tawaran. Tarik untuk refresh."));
                    }

                    final offers = snapshot.data!;

                    return RefreshIndicator(
                      onRefresh: () async {
                        _refreshOffers();
                      },
                      child: ListView.builder(
                        itemCount: offers.length,
                        itemBuilder: (context, index) {
                          final offerData = offers[index];

                          // Data dari API
                          final String delivererName =
                              offerData['deliverer']?['nama'] ?? 'Deliverer';
                          final num fee = offerData['fee'] ?? 0;

                          return Card(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            child: ListTile(
                              leading: const Icon(Icons.delivery_dining,
                                  color: Colors.green),
                              title: Text(delivererName),
                              subtitle: Text(
                                'Rp ${fee.toStringAsFixed(0)}',
                              ),
                              trailing: ElevatedButton(
                                onPressed: _isAccepting
                                    ? null
                                    : () => _acceptOffer(offerData),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Terima'),
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// [MODIFIKASI]: Tambahkan helper JwtDecoder (bisa dipindah ke file util)
class JwtDecoder {
  static Map<String, dynamic> decode(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      throw Exception('invalid token');
    }
    final payload = _decodeBase64(parts[1]);
    final payloadMap = json.decode(payload);
    if (payloadMap is! Map<String, dynamic>) {
      throw Exception('invalid payload');
    }
    return payloadMap;
  }

  static String _decodeBase64(String str) {
    String output = str.replaceAll('-', '+').replaceAll('_', '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw Exception('Illegal base64url string!"');
    }
    return utf8.decode(base64Url.decode(output));
  }
}
