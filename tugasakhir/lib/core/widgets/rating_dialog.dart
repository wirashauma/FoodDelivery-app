import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class RatingDialog extends StatefulWidget {
  final Map<String, dynamic> order;
  final String orderId;

  const RatingDialog({super.key, required this.order, required this.orderId});

  @override
  State<RatingDialog> createState() => _RatingDialogState();
}

class _RatingDialogState extends State<RatingDialog> {
  double delivererRating = 0;
  String delivererComment = '';
  Map<String, double> productRatings = {};
  bool isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final delivererName = widget.order['delivererName'] ?? 'Driver';
    final delivererId = widget.order['delivererTerpilihId'] ?? '';
    final items = List<Map<String, dynamic>>.from(widget.order['items'] ?? []);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      title: const Text('Kasih Rating', style: TextStyle(fontWeight: FontWeight.bold)),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // === DRIVER SECTION ===
            Text('Driver: $delivererName', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            RatingBar.builder(
              initialRating: delivererRating,
              minRating: 1,
              allowHalfRating: true,
              itemCount: 5,
              itemSize: 28,
              unratedColor: Colors.grey.shade300,
              itemBuilder: (context, _) => const Icon(Icons.star, color: Colors.amber),
              onRatingUpdate: (rating) => setState(() => delivererRating = rating),
            ),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(
                hintText: 'Komentar untuk driver (opsional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
              onChanged: (val) => delivererComment = val,
            ),
            const SizedBox(height: 16),

            // === PRODUCT SECTION ===
            const Text('Rating untuk Produk:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...items.map((item) {
              final name = item['name'] ?? 'Produk';
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name),
                  const SizedBox(height: 4),
                  RatingBar.builder(
                    initialRating: productRatings[name] ?? 0,
                    minRating: 1,
                    allowHalfRating: true,
                    itemCount: 5,
                    itemSize: 24,
                    unratedColor: Colors.grey.shade300,
                    itemBuilder: (context, _) => const Icon(Icons.star, color: Colors.amber),
                    onRatingUpdate: (rating) => setState(() => productRatings[name] = rating),
                  ),
                  const SizedBox(height: 10),
                ],
              );
            }).toList(),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: isSubmitting
              ? null
              : () async {
                  await _submitRatings(delivererId);
                },
          child: isSubmitting
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Kirim'),
        ),
      ],
    );
  }

  Future<void> _submitRatings(String delivererId) async {
    if (delivererRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Beri rating untuk driver dulu ya!')),
      );
      return;
    }

    setState(() => isSubmitting = true);

    final batch = FirebaseFirestore.instance.batch();

    // === Update Rating Driver ===
    if (delivererId.isNotEmpty) {
      final delivererRef = FirebaseFirestore.instance.collection('users').doc(delivererId);
      batch.update(delivererRef, {
        'delivererTotalRating': FieldValue.increment(delivererRating),
        'delivererRatingCount': FieldValue.increment(1),
      });
    }

    // === Update Rating Produk ===
    for (final entry in productRatings.entries) {
      final productRef = FirebaseFirestore.instance.collection('products').doc(entry.key);
      batch.update(productRef, {
        'totalRating': FieldValue.increment(entry.value),
        'ratingCount': FieldValue.increment(1),
      });
    }

    // === Tandai order sudah diberi rating ===
    final orderRef = FirebaseFirestore.instance.collection('orders').doc(widget.orderId);
    batch.update(orderRef, {'isRated': true});

    await batch.commit();

    setState(() => isSubmitting = false);
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Terima kasih atas penilaianmu!')),
    );
  }
}
