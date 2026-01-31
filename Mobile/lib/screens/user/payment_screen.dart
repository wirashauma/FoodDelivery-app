import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:titipin_app/config/colors.dart';
import 'package:titipin_app/config/api_config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentScreen extends StatefulWidget {
  final String orderId;
  final Map<String, dynamic>? orderData;

  const PaymentScreen({super.key, required this.orderId, this.orderData});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late WebViewController _webViewController;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[Payment] $message');
    }
  }

  bool _isLoading = true;
  bool _isProcessingPayment = false;
  bool _showWebView = false;
  bool _isPolling = false;
  bool _paymentCompleted = false;

  Map<String, dynamic>? _orderDetails;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
    _loadOrderDetails();
  }

  @override
  void dispose() {
    _isPolling = false;
    _paymentCompleted = false;
    super.dispose();
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            if (mounted) {
              setState(() => _isProcessingPayment = false);
              _checkPaymentSuccess(url);
            }
          },
          onPageStarted: (String url) {
            _log('webview start: $url');
            _checkPaymentSuccess(url);
          },
          onWebResourceError: (WebResourceError error) {
            _log('webview error: ${error.description}');
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Error: ${error.description}'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
        ),
      );
  }

  // Helper to check if status represents paid order
  bool isPaidStatus(String? status) {
    final value = (status ?? '').toUpperCase().trim();
    return value == 'PAID' ||
        value == 'LUNAS' ||
        value == 'SETTLED' ||
        value == 'SUCCESS';
  }

  // Helper to check if status represents failed order
  bool isFailedStatus(String? status) {
    final value = (status ?? '').toUpperCase().trim();
    return value == 'FAILED' || value == 'CANCELLED' || value == 'EXPIRED';
  }

  Future<void> _checkPaymentSuccess(String url) async {
    _log('check payment: $url');

    if (_paymentCompleted || _isPolling) {
      _log('skip: completed=$_paymentCompleted polling=$_isPolling');
      return;
    }

    final urlLower = url.toLowerCase();

    if (urlLower.contains('payment-success') ||
        urlLower.contains('status=settlement') ||
        urlLower.contains('settlement') ||
        urlLower.contains('transaction_status=settlement') ||
        urlLower.contains('transaction_status=capture') ||
        urlLower.contains('transaction_status=success') ||
        urlLower.contains('/finish') ||
        urlLower.contains('status=success')) {
      _log('success detected (url)');

      _paymentCompleted = true;

      if (mounted) {
        setState(() => _showWebView = false);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Pembayaran berhasil! Pesanan sedang diproses.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );

        await Future.delayed(const Duration(seconds: 1));
        if (mounted) await _refreshOrderAndClose();
      }
      return;
    }
  }

  Future<void> _refreshOrderAndClose() async {
    try {
      if (_isPolling) return;
      _isPolling = true;

      if (mounted) {
        setState(() {
          _showWebView = false;
          _isProcessingPayment = true;
        });
      }

      // Wait a moment for backend to process
      await Future.delayed(const Duration(seconds: 2));

      if (!mounted) return;
      setState(() => _isProcessingPayment = false);

      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _isProcessingPayment = false);
      if (mounted) {
        Navigator.pop(context, true);
      }
    } finally {
      _isPolling = false;
    }
  }

  Future<void> _loadOrderDetails() async {
    try {
      setState(() => _isLoading = true);

      _log('load order details (hasExtra=${widget.orderData != null})');

      if (widget.orderData != null) {
        _log('using route extra');
        setState(() {
          _orderDetails = widget.orderData;
          _isLoading = false;
        });
        return;
      }

      if (widget.orderId.isEmpty) {
        throw Exception('Order ID is empty');
      }

      // Fetch order from API
      final token = await _storage.read(key: 'accessToken');
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.ordersEndpoint}/${widget.orderId}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _orderDetails = data;
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load order');
      }
    } catch (e) {
      _log('load order error: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading order: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _getPaymentToken() async {
    try {
      if (widget.orderId.isEmpty) {
        _log('invalid orderId (empty)');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('❌ Order ID tidak valid.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      setState(() => _isProcessingPayment = true);

      // Get snap URL from order data or fetch from API
      String? snapUrl = widget.orderData?['snapUrl'] as String?;

      _log(
          'getPaymentToken (hasSnapUrl=${snapUrl != null && snapUrl.isNotEmpty})');

      if (snapUrl != null && snapUrl.isNotEmpty) {
        _log('using snapUrl from order data');
      } else {
        // Fetch payment token from API
        _log('snapUrl missing; requesting from API');

        final token = await _storage.read(key: 'accessToken');
        if (token == null) {
          throw Exception('Not authenticated');
        }

        final response = await http.post(
          Uri.parse('${ApiConfig.baseUrl}/payment/token'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'orderId': widget.orderId}),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          snapUrl = data['snapUrl'] as String?;
          final snapToken = data['snapToken'] as String?;

          if ((snapUrl == null || snapUrl.isEmpty) &&
              snapToken != null &&
              snapToken.isNotEmpty) {
            // Build Midtrans vtweb URL
            snapUrl =
                'https://app.sandbox.midtrans.com/snap/v2/vtweb/$snapToken';
            _log('built snapUrl from snapToken');
          }
        }

        if (snapUrl == null || snapUrl.isEmpty) {
          throw Exception('Tidak bisa mendapatkan URL pembayaran.');
        }

        _log('payment token received');
      }

      _log('load webview');
      await _webViewController.loadRequest(Uri.parse(snapUrl));
      setState(() => _showWebView = true);
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessingPayment = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_showWebView,
      onPopInvokedWithResult: (didPop, result) async {
        if (_showWebView && !didPop) {
          if (!mounted) return;
          final navigator = Navigator.of(context);
          final confirm = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Batalkan Pembayaran?'),
              content: const Text(
                'Anda belum menyelesaikan pembayaran. Apakah Anda ingin membatalkan?',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Lanjutkan Pembayaran'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Batalkan'),
                ),
              ],
            ),
          );

          if (!mounted) return;
          if (confirm == true) {
            navigator.pop(false);
          }
        }
      },
      child: Scaffold(
        appBar: _showWebView
            ? null
            : AppBar(
                title: const Text('Pembayaran'),
                centerTitle: true,
                elevation: 0,
                backgroundColor: Colors.white,
                foregroundColor: AppColors.textPrimary,
              ),
        body: _showWebView
            ? SafeArea(child: WebViewWidget(controller: _webViewController))
            : _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _orderDetails == null
                    ? _buildErrorWidget()
                    : _buildPaymentSummary(),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          const Text('Gagal memuat data pesanan'),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadOrderDetails,
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSummary() {
    final order = _orderDetails!;
    final totalPrice = double.tryParse(order['totalAmount']?.toString() ??
            order['total']?.toString() ??
            '0') ??
        0.0;

    return SingleChildScrollView(
      child: Column(
        children: [
          // Order Summary Card
          _buildOrderSummaryCard(order, totalPrice),
          const SizedBox(height: 24),

          // Continue Payment Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isProcessingPayment ? null : _getPaymentToken,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _isProcessingPayment
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.payment, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Lanjutkan Pembayaran',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Info Card
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _buildInfoCard(),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildOrderSummaryCard(Map<String, dynamic> order, double totalPrice) {
    final orderNumber =
        order['orderNumber'] ?? order['id']?.toString() ?? 'N/A';
    final destination = order['destination'] ?? '';
    final status = order['status'] ?? 'PENDING';

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.shopping_bag,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Ringkasan Pesanan',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '#$orderNumber',
                      style: const TextStyle(
                        color: AppColors.grey500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Details
          _buildDetailRow('Status', _getStatusLabel(status)),
          if (destination.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildDetailRow('Alamat Pengiriman', destination),
          ],
          const SizedBox(height: 16),

          // Divider
          const Divider(color: Color(0xFFE5E7EB)),
          const SizedBox(height: 16),

          // Total
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total Pembayaran',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  'Rp ${_formatPrice(totalPrice)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.grey500,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline, color: Color(0xFF1E40AF), size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Pembayaran akan diproses melalui Midtrans. Transaksi Anda aman dan terlindungi.',
              style: TextStyle(
                color: Color(0xFF1E40AF),
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(double price) {
    return NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0)
        .format(price);
  }

  String _getStatusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Menunggu Pembayaran';
      case 'WAITING_FOR_OFFERS':
        return 'Menunggu Penawaran';
      case 'OFFER_ACCEPTED':
        return 'Pesanan Diterima';
      case 'ON_DELIVERY':
        return 'Dalam Pengiriman';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  }
}
