import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/data/models/product_model.dart';

class CartService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Fungsi addToCart sekarang menerima parameter 'note' opsional
  Future<void> addToCart({
    required Product product,
    required int quantity,
    String? note,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception("Anda harus login untuk menambahkan item ke keranjang.");
    }

    final cartItemRef = _firestore
        .collection('carts')
        .doc(user.uid)
        .collection('items')
        .doc(product.id);

    await cartItemRef.set({
      'productId': product.id,
      'name': product.name,
      'price': product.price,
      'imageUrl': product.imageUrl, // Diubah dari imagePath ke imageUrl
      'quantity': quantity,
      'note': note ?? '',
    }, SetOptions(merge: true));
  
  }

  Future<void> updateItemQuantity(String productId, int newQuantity) async {
    final user = _auth.currentUser;
    if (user == null) return;

    if (newQuantity <= 0) {
      await removeFromCart(productId);
    } else {
      await _firestore.collection('carts').doc(user.uid).collection('items').doc(productId).update({'quantity': newQuantity});
    }
  }

  Future<void> removeFromCart(String productId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore.collection('carts').doc(user.uid).collection('items').doc(productId).delete();
  }
}

