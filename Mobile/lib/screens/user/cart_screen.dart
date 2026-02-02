import 'package:flutter/material.dart';
import 'package:titipin_app/config/colors.dart';
import 'package:titipin_app/services/cart_service.dart';
import 'package:titipin_app/screens/user/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<Map<String, dynamic>> cartItems = [];
  bool _isLoading = true;
  String _errorMessage = '';
  final Set<String> _pendingOperations = {}; // Track pending operations

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final items = await CartService.getCartItems();
      if (mounted) {
        setState(() {
          cartItems = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateQuantity(String cartItemId, int newQuantity) async {
    if (newQuantity < 1) {
      _removeItem(cartItemId);
      return;
    }

    // Prevent duplicate operations
    if (_pendingOperations.contains(cartItemId)) return;
    _pendingOperations.add(cartItemId);

    // Store old state for rollback
    final oldItems = List<Map<String, dynamic>>.from(
      cartItems.map((item) => Map<String, dynamic>.from(item)),
    );

    // Optimistic update - update UI immediately
    setState(() {
      final index = cartItems.indexWhere((item) => item['id'] == cartItemId);
      if (index != -1) {
        cartItems[index] = Map<String, dynamic>.from(cartItems[index]);
        cartItems[index]['quantity'] = newQuantity;
      }
    });

    try {
      await CartService.updateCartItem(cartItemId, newQuantity);
      // Success - keep the optimistic update
    } catch (e) {
      // Rollback on failure
      if (mounted) {
        setState(() {
          cartItems = oldItems;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      _pendingOperations.remove(cartItemId);
    }
  }

  Future<void> _removeItem(String cartItemId) async {
    // Prevent duplicate operations
    if (_pendingOperations.contains(cartItemId)) return;
    _pendingOperations.add(cartItemId);

    // Store old state for rollback
    final oldItems = List<Map<String, dynamic>>.from(
      cartItems.map((item) => Map<String, dynamic>.from(item)),
    );
    final removedIndex =
        cartItems.indexWhere((item) => item['id'] == cartItemId);
    final removedItem = removedIndex != -1 ? oldItems[removedIndex] : null;

    // Optimistic update - remove from UI immediately
    setState(() {
      cartItems.removeWhere((item) => item['id'] == cartItemId);
    });

    try {
      await CartService.removeFromCart(cartItemId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Item removed from cart'),
            backgroundColor: AppColors.primary,
            action: removedItem != null
                ? SnackBarAction(
                    label: 'Undo',
                    textColor: AppColors.white,
                    onPressed: () {
                      // Re-add item if undo is pressed
                      _undoRemove(removedItem);
                    },
                  )
                : null,
          ),
        );
      }
    } catch (e) {
      // Rollback on failure
      if (mounted) {
        setState(() {
          cartItems = oldItems;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to remove: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      _pendingOperations.remove(cartItemId);
    }
  }

  Future<void> _undoRemove(Map<String, dynamic> item) async {
    final product = item['product'];
    if (product != null && product['id'] != null) {
      try {
        await CartService.addToCart(product['id'], item['quantity'] ?? 1);
        _loadCart(); // Refresh to get proper IDs
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to restore item: ${e.toString()}'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  double _calculateTotal() {
    double total = 0;
    for (final item in cartItems) {
      final product = item['product'];
      final price = double.tryParse(product['price'].toString()) ?? 0;
      final quantity = item['quantity'] ?? 1;
      total += price * quantity;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Your Cart',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _errorMessage.isNotEmpty
              ? _buildErrorState()
              : cartItems.isEmpty
                  ? _buildEmptyState()
                  : _buildCartList(),
      bottomNavigationBar: cartItems.isNotEmpty ? _buildBottomBar() : null,
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: AppColors.grey400,
          ),
          const SizedBox(height: 16),
          Text(
            _errorMessage,
            style: const TextStyle(color: AppColors.grey600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadCart,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.shopping_cart_outlined,
              size: 64,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Your cart is empty',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start adding your favorite meals!',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    return RefreshIndicator(
      onRefresh: _loadCart,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: cartItems.length,
        itemBuilder: (context, index) {
          final item = cartItems[index];
          return _buildCartItem(item);
        },
      ),
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item) {
    final product = item['product'];
    final price = double.tryParse(product['price'].toString()) ?? 0;
    final quantity = item['quantity'] ?? 1;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Product Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              product['imageUrl'] ?? '',
              width: 70,
              height: 70,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: AppColors.grey200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.fastfood,
                  color: AppColors.grey400,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),

          // Product Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['name'] ?? 'Product',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '\$${price.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.grey500,
                  ),
                ),
              ],
            ),
          ),

          // Quantity Controls
          Column(
            children: [
              // Delete button
              GestureDetector(
                onTap: () => _removeItem(item['id']),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  child: const Icon(
                    Icons.close,
                    color: AppColors.primary,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Quantity
              Row(
                children: [
                  _buildQuantityButton(
                    Icons.remove,
                    () => _updateQuantity(item['id'], quantity - 1),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      '$quantity',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  _buildQuantityButton(
                    Icons.add,
                    () => _updateQuantity(item['id'], quantity + 1),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppColors.grey100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 16,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CheckoutScreen(
                    cartItems: cartItems,
                    total: _calculateTotal(),
                  ),
                ),
              ).then((_) => _loadCart());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Confirm order',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
