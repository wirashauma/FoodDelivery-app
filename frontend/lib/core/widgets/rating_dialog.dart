import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

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
              final productId = item['id'] ?? name; // Fallback ke nama jika ID tidak ada

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name),
                  const SizedBox(height: 4),
                  RatingBar.builder(
                    initialRating: productRatings[productId] ?? 0,
                    minRating: 1,
                    allowHalfRating: true,
                    itemCount: 5,
                    itemSize: 24,
                    unratedColor: Colors.grey.shade300,
                    itemBuilder: (context, _) => const Icon(Icons.star, color: Colors.amber),
                    onRatingUpdate: (rating) => setState(() => productRatings[productId] = rating),
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
                  // Kita masih perlu delivererId untuk dikirim ke API
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
    // 1. Validasi (Logika UI, ini BUKAN Firebase)
    if (delivererRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Beri rating untuk driver dulu ya!')),
      );
      return;
    }

    // 2. Set loading state (Logika UI)
    setState(() => isSubmitting = true);
    
    // a. Siapkan data untuk dikirim (dalam format JSON)
    final Map<String, dynamic> ratingData = {
      'orderId': widget.orderId,
      'delivererId': delivererId,
      'delivererRating': delivererRating,
      'delivererComment': delivererComment,
      'productRatings': productRatings, 
    };

    await Future.delayed(const Duration(seconds: 2));

    setState(() => isSubmitting = false);
    
    // 4. Tutup dialog dan beri pesan sukses (Logika UI)
    if (!mounted) return; // Praktik terbaik setelah 'await'
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Terima kasih atas penilaianmu!')),
    );
  }
}