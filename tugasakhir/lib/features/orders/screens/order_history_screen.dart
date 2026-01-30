import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:tugasakhir/features/chat/screens/chat_screen.dart';
import 'package:tugasakhir/features/cart/screens/cart_screen.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart'; 

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final String currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';
  final Map<String, bool> _reorderingState = {};
  // State untuk melacak loading tombol "Kirim Penilaian"
  final Map<String, bool> _ratingState = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // --- FUNGSI LOGIKA "PESAN LAGI" ---
  Future<void> _reOrder(
      String orderId, List<Map<String, dynamic>> items) async {
    if (_reorderingState[orderId] == true || currentUserId.isEmpty) return;

    setState(() {
      _reorderingState[orderId] = true;
    });

    try {
      final cartItemsRef = FirebaseFirestore.instance
          .collection('carts')
          .doc(currentUserId)
          .collection('items');
      final batch = FirebaseFirestore.instance.batch();

      for (var item in items) {
        final productId = item['productId'];
        if (productId != null) {
          final docRef = cartItemsRef.doc(productId);
          final newItem = {
            'productId': item['productId'],
            'name': item['name'],
            'price': item['price'],
            'imageUrl': item['imageUrl'],
            'quantity': item['quantity'],
            'note': item['note'] ?? '',
          };
          batch.set(docRef, newItem, SetOptions(merge: true));
        }
      }

      await batch.commit();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Item telah ditambahkan kembali ke keranjang!'),
              backgroundColor: Colors.green),
        );
        Navigator.of(context).push(
          MaterialPageRoute(builder: (context) => const CartScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memesan lagi: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _reorderingState[orderId] = false;
        });
      }
    }
  }

  // --- FUNGSI MODIFIKASI: DIALOG RATING (Deliverer + Produk) ---
  void _showRatingDialog(
      BuildContext context, Map<String, dynamic> order, String orderId) {
    final delivererId = order['delivererTerpilihId'];
    final delivererName = order['delivererName'] ?? 'Deliverer';
    final items = List<Map<String, dynamic>>.from(order['items'] ?? []);

    // State untuk menyimpan rating di dalam dialog
    double delivererRating = 0.0;
    Map<String, double> productRatings = {};
    for (var item in items) {
      // Pastikan productId ada dan bertipe String
      final productId = item['productId'] as String?;
      if (productId != null) {
        productRatings[productId] = 0.0; // Inisialisasi rating produk
      }
    }
    final TextEditingController commentController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(builder: (context, setDialogState) {
          return AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Text("Beri Penilaian",
                style: TextStyle(fontWeight: FontWeight.bold)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // === Bagian Deliverer ===
                  Text("Bagaimana kinerja $delivererName?",
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Center(
                    child: RatingBar.builder(
                      initialRating: delivererRating,
                      minRating: 1,
                      itemCount: 5,
                      itemSize: 35,
                      itemBuilder: (context, _) =>
                          const Icon(Icons.star, color: Colors.amber),
                      onRatingUpdate: (rating) {
                        setDialogState(() => delivererRating = rating);
                      },
                    ),
                  ),
                  const Divider(height: 24, thickness: 1),

                  // === Bagian Produk ===
                  const Text("Beri rating untuk produk:",
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  ...items.map((item) {
                    final productId = item['productId'] as String?;
                    final name = item['name'] ?? 'Produk';
                    if (productId == null) return const SizedBox.shrink();

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 15)),
                        Center(
                          child: RatingBar.builder(
                            initialRating: productRatings[productId] ?? 0.0,
                            minRating: 1,
                            itemCount: 5,
                            itemSize: 35,
                            itemBuilder: (context, _) =>
                                const Icon(Icons.star, color: Colors.amber),
                            onRatingUpdate: (rating) {
                              setDialogState(
                                  () => productRatings[productId] = rating);
                            },
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                    );
                  }).toList(),

                  // === Kolom Komentar (Opsional) ===
                  const SizedBox(height: 12),
                  TextField(
                    controller: commentController,
                    decoration: InputDecoration(
                      labelText: "Tulis komentar (opsional)",
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                child:
                    const Text("Batal", style: TextStyle(color: Colors.grey)),
                onPressed: () => Navigator.pop(context),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935), // Warna tema
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text("Kirim Penilaian"),
                onPressed: () async {
                  // Validasi
                  if (delivererRating == 0.0 ||
                      productRatings.containsValue(0.0)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text(
                              'Harap beri rating untuk deliverer dan semua item.')),
                    );
                    return;
                  }

                  await _submitRating(
                    orderId: orderId,
                    delivererId: delivererId,
                    delivererRating: delivererRating,
                    productRatings: productRatings,
                    comment: commentController.text,
                  );
                  if (context.mounted) Navigator.pop(context);
                },
              ),
            ],
          );
        });
      },
    );
  }

  // --- FUNGSI MODIFIKASI: KIRIM RATING KE FIRESTORE ---
  Future<void> _submitRating({
    required String orderId,
    required String delivererId,
    required double delivererRating,
    required Map<String, double> productRatings,
    String? comment,
  }) async {
    final firestore = FirebaseFirestore.instance;
    // Tampilkan loading di kartu riwayat, bukan di dialog
    setState(() {
      _ratingState[orderId] = true;
    });

    try {
      // 1. Update Rating Deliverer (transaksi)
      if (delivererId.isNotEmpty) {
        final delivererRef = firestore.collection('users').doc(delivererId);
        await firestore.runTransaction((transaction) async {
          final delivererDoc = await transaction.get(delivererRef);
          if (!delivererDoc.exists) return;

          final double currentTotal =
              (delivererDoc.data()?['delivererTotalRating'] as num?)
                      ?.toDouble() ??
                  0.0;
          final int currentCount =
              (delivererDoc.data()?['delivererRatingCount'] as num?)?.toInt() ??
                  0;

          transaction.update(delivererRef, {
            'delivererTotalRating': currentTotal + delivererRating,
            'delivererRatingCount': currentCount + 1,
          });
        });
      }

      // 2. Update Rating Produk (looping transaksi)
      for (var entry in productRatings.entries) {
        final productId = entry.key;
        final double rating = entry.value;

        final productRef = firestore.collection('products').doc(productId);
        await firestore.runTransaction((transaction) async {
          final productDoc = await transaction.get(productRef);
          if (!productDoc.exists) return;

          final double currentTotal =
              (productDoc.data()?['totalRating'] as num?)?.toDouble() ?? 0.0;
          final int currentCount =
              (productDoc.data()?['ratingCount'] as num?)?.toInt() ?? 0;

          transaction.update(productRef, {
            'totalRating': currentTotal + rating,
            'ratingCount': currentCount + 1,
          });
        });
      }

      // 3. Tandai pesanan sebagai "sudah dirating" dan simpan komentar
      await firestore.collection('orders').doc(orderId).update({
        'isRated': true,
        'ratingComment': comment ?? '',
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Terima kasih atas rating Anda!'),
              backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengirim rating: ${e.toString()}')),
        );
      }
    } finally {
      // Hentikan loading di kartu riwayat
      if (mounted) {
        setState(() {
          _ratingState[orderId] = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (currentUserId.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Riwayat Pesanan')),
        body: const Center(
            child: Text('Silakan login untuk melihat riwayat pesanan.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Riwayat Pesanan'),
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Dalam Proses'),
            Tab(text: 'Selesai'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOrderList(context, ['dalam_proses', 'makanan_diambil']),
          _buildOrderList(context, ['selesai']),
        ],
      ),
    );
  }

  // Widget bantuan untuk membangun daftar pesanan berdasarkan status
  Widget _buildOrderList(BuildContext context, List<String> statuses) {
    Query<Map<String, dynamic>> query = FirebaseFirestore.instance
        .collection('orders')
        .where('userId', isEqualTo: currentUserId)
        .where('status', whereIn: statuses)
        .orderBy('createdAt', descending: true);

    final bool isInProgressTab =
        statuses.any((s) => s == 'dalam_proses' || s == 'makanan_diambil');
    if (isInProgressTab) {
      query = query.limit(1); // Hanya tampilkan 1 pesanan aktif
    }

    return StreamBuilder<QuerySnapshot>(
      stream: query.snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return Center(
            child: Text(
              isInProgressTab
                  ? 'Tidak ada pesanan aktif saat ini.'
                  : 'Belum ada pesanan selesai.',
            ),
          );
        }

        final orders = snapshot.data!.docs;

        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: orders.length,
          itemBuilder: (context, index) {
            final order = orders[index].data() as Map<String, dynamic>;
            final orderId = orders[index].id;
            final bool isCompleted = statuses.contains('selesai');

            if (isCompleted) {
              return _buildCompletedOrderCard(context, order, orderId);
            } else {
              return _buildInProgressOrderCard(context, order, orderId);
            }
          },
        );
      },
    );
  }

  // --- WIDGET KARTU "SELESAI" (DIMODIFIKASI UNTUK RATING) ---
  Widget _buildCompletedOrderCard(
      BuildContext context, Map<String, dynamic> order, String orderId) {
    final double ongkirFinal =
        (order['ongkirFinal'] as num?)?.toDouble() ?? 0.0;
    final Timestamp createdAt = order['createdAt'] ?? Timestamp.now();
    final String formattedDate =
        DateFormat('dd MMM yyyy, HH:mm').format(createdAt.toDate());

    List<Map<String, dynamic>> items = (order['items'] as List<dynamic>?)
            ?.map((item) => item as Map<String, dynamic>)
            .toList() ??
        [];

    String firstItemImage =
        items.isNotEmpty ? (items[0]['imageUrl'] ?? '') : '';

    String titleName = items.map((e) => e['name'] ?? '').join(', ');
    if (titleName.isEmpty) titleName = 'Pesanan Selesai';

    String itemsSummary =
        items.map((e) => '${e['quantity']} ${e['name']}').join(', ');
    if (itemsSummary.isEmpty) itemsSummary = 'Tidak ada detail item';

    double itemsTotal = items.fold(0.0,
        (sum, item) => sum + ((item['price'] ?? 0) * (item['quantity'] ?? 0)));
    double grandTotal = itemsTotal + ongkirFinal;

    final bool isThisReordering = _reorderingState[orderId] ?? false;
    final bool isThisRating = _ratingState[orderId] ?? false;

    // --- PERUBAHAN DI SINI: Cek status rating ---
    final bool isRated = order['isRated'] ?? false;
    final String delivererId = order['delivererTerpilihId'] ?? '';
    final String delivererName = order['delivererName'] ?? 'Deliverer';

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      elevation: 3,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: firstItemImage.isNotEmpty
                      ? Image.network(firstItemImage,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          errorBuilder: (c, o, s) => _imageErrorPlaceholder())
                      : _imageErrorPlaceholder(),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(titleName,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                      Text(formattedDate,
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12)),
                      Text(itemsSummary,
                          style: const TextStyle(
                              color: Colors.black87, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const Icon(Icons.thumb_up_alt_outlined, color: Colors.orange),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Rp ${grandTotal.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('${items.length} Menu',
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
                ElevatedButton(
                  onPressed:
                      isThisReordering ? null : () => _reOrder(orderId, items),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE53935),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20)),
                  ),
                  child: isThisReordering
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Pesan lagi'),
                ),
              ],
            ),
            const Divider(height: 20),

            // --- 4. BAGIAN RATING (DIMODIFIKASI TOTAL) ---
            GestureDetector(
              // Panggil dialog rating jika belum dirating dan tidak sedang loading
              onTap: isRated || isThisRating
                  ? null
                  : () => _showRatingDialog(context, order, orderId),
              behavior: HitTestBehavior.opaque,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isRated ? 'Anda sudah memberi rating' : 'Kasih rating...',
                    style: TextStyle(
                      color: isRated
                          ? Colors.green
                          : (isThisRating ? Colors.grey : Colors.blueAccent),
                      fontSize: 14,
                      fontWeight: isRated ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                  isThisRating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : Row(
                          children: List.generate(
                              5,
                              (index) => Icon(
                                  isRated ? Icons.star : Icons.star_border,
                                  color: isRated
                                      ? Colors.amber
                                      : Colors.grey[400])),
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Placeholder jika gambar error
  Widget _imageErrorPlaceholder() {
    return Container(
        width: 60,
        height: 60,
        color: Colors.grey[200],
        child: const Icon(Icons.store, color: Colors.grey));
  }

  // --- WIDGET UNTUK TAMPILAN "DALAM PROSES" (SESUAI DESAIN BARU) ---
  Widget _buildInProgressOrderCard(
      BuildContext context, Map<String, dynamic> order, String orderId) {
    final String delivererName =
        order['delivererName'] ?? 'Driver belum ditugaskan';
    final String delivererId = order['delivererTerpilihId'] ?? '';
    final double ongkirFinal =
        (order['ongkirFinal'] as num?)?.toDouble() ?? 0.0;
    final String status = order['status'] ?? 'dalam_proses';
    final String lokasiAntar = order['lokasiAntar'] ?? '';
    final String lokasiJemput = order['lokasiJemput'] ?? '';

    String title = '';
    String subtitle = '';
    IconData statusIcon = Icons.soup_kitchen_outlined;

    switch (status) {
      case 'dalam_proses':
        title = 'Pesananmu lagi disiapin 🍳';
        subtitle = 'Driver meluncur ke restoran';
        statusIcon = Icons.soup_kitchen_outlined;
        break;
      case 'makanan_diambil':
        title = 'Pesanan sudah diambil 🚗';
        subtitle = 'Driver sedang menuju ke alamatmu';
        statusIcon = Icons.delivery_dining;
        break;
      default:
        title = 'Pesanan dalam proses';
        subtitle = 'Menunggu update dari restoran';
    }

    Color primaryColor = const Color(0xFFE53935);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      elevation: 4,
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(statusIcon, size: 60, color: Colors.grey[600]),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(color: Colors.grey),
            ),
            const Divider(height: 24),
            Row(
              children: [
                const Icon(Icons.store, color: Colors.orange, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Ambil di: $lokasiJemput',
                    style: const TextStyle(fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.green, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Antar ke: $lokasiAntar',
                    style: const TextStyle(fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(),
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Colors.grey[200],
                  child: const Icon(Icons.person, size: 30, color: Colors.grey),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        delivererName,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Biaya kirim: Rp ${ongkirFinal.toStringAsFixed(0)}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.call, color: primaryColor),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text(
                                  'Fitur panggilan belum diimplementasikan.')),
                        );
                      },
                    ),
                    IconButton(
                      icon: Icon(Icons.chat, color: primaryColor),
                      onPressed: () {
                        if (delivererId.isNotEmpty) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => ChatScreen(
                                orderId: orderId,
                                otherUserName: delivererName,
                                delivererId: delivererId,
                              ),
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
