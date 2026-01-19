import 'dart:async';
import 'package:titipin_app/data/models/product_model.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class CartService {
  static final CartService _instance = CartService._internal();
  factory CartService() => _instance;

  final Map<String, Map<String, dynamic>> _cartItems = {};

  final _cartController = StreamController<List<Map<String, dynamic>>>.broadcast();

  static const String _cartKey = 'cart_items_storage';

  Stream<List<Map<String, dynamic>>> get cartStream => _cartController.stream;

  List<Map<String, dynamic>> get currentCartItems => _cartItems.values.toList();

  CartService._internal() {
    _loadCart();
  }

  void _notify() {
    _cartController.add(_cartItems.values.toList());
  }

  Future<void> _saveCart() async {
    final prefs = await SharedPreferences.getInstance();
    final String encodedCart = json.encode(_cartItems);
    await prefs.setString(_cartKey, encodedCart);
  }

  Future<void> _loadCart() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey(_cartKey)) {
      _notify();
      return;
    }
    
    final String? encodedCart = prefs.getString(_cartKey);
    if (encodedCart == null) {
      _notify();
      return;
    }

    final Map<String, dynamic> decodedCart = json.decode(encodedCart);
    
    _cartItems.clear();
    decodedCart.forEach((key, value) {
      _cartItems[key] = Map<String, dynamic>.from(value);
    });

    _notify();
  }

  void addToCart({
    required Product product,
    required int quantity,
    String? note,
  }) {
    final cartItem = {
      'productId': product.id,
      'name': product.name,
      'price': product.price,
      'imageUrl': product.imageUrl,
      'quantity': quantity,
      'note': note ?? '',
    };

    _cartItems[product.id] = cartItem;
    _notify();
    _saveCart();
  }

  void updateItemQuantity(String productId, int newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      if (_cartItems.containsKey(productId)) {
        _cartItems[productId]!['quantity'] = newQuantity;
        _notify();
        _saveCart();
      }
    }
  }

  void removeFromCart(String productId) {
    _cartItems.remove(productId);
    _notify();
    _saveCart();
  }

  List<Map<String, dynamic>> getCartItems() {
    return _cartItems.values.toList();
  }

  void clearCart() {
    _cartItems.clear();
    _notify();
    _saveCart();
  }

  void dispose() {
    _cartController.close();
  }
}