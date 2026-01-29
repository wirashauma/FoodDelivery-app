import 'package:flutter/material.dart';
import 'package:titipin_app/data/models/product_model.dart';
import 'package:titipin_app/features/explore/screens/product_detail_screen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:titipin_app/core/constants/api_config.dart';

class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  final List<String> categories = const ["Makanan", "Minuman", "Snack", "Buah"];

  Future<List<Product>> _fetchProductsFromApi() async {
    final url = Uri.parse(ApiConfig.productsEndpoint);

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);

        List<Product> products = jsonData.map((data) {
          return Product(
            id: data['id'].toString(),
            name: data['nama'],
            price: (data['harga'] as int).toDouble(),
            description: data['deskripsi'],
            category: data['kategori'],
            imageUrl: data['imageUrl'],
            ratingCount: 0,
          );
        }).toList();

        return products;
      } else {
        throw Exception('Gagal memuat produk: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error koneksi: ${e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(isTablet),
              _buildSearchBar(isTablet),
              _buildPromoBanner(isTablet),
              SizedBox(height: isTablet ? 28 : 20),
              FutureBuilder<List<Product>>(
                future: _fetchProductsFromApi(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                        heightFactor: 5, child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return Center(child: Text('Error: ${snapshot.error}'));
                  }
                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const Center(
                        child: Text('Belum ada produk dari API.'));
                  }

                  final allProducts = snapshot.data!;

                  return Column(
                    children: categories.map((category) {
                      final categoryProducts = allProducts
                          .where((product) => product.category == category)
                          .toList();

                      if (categoryProducts.isEmpty) {
                        return const SizedBox.shrink();
                      }

                      return _buildCategorySection(
                        context: context,
                        title: category,
                        items: categoryProducts,
                        isTablet: isTablet,
                      );
                    }).toList(),
                  );
                },
              ),
              SizedBox(height: isTablet ? 28 : 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isTablet) {
    return Padding(
      padding: EdgeInsets.fromLTRB(isTablet ? 32 : 20, isTablet ? 28 : 20,
          isTablet ? 32 : 20, isTablet ? 14 : 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "What we offer",
                style: TextStyle(
                    fontSize: isTablet ? 32 : 24, fontWeight: FontWeight.bold),
              ),
              Text(
                "Our menu that we provide",
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: isTablet ? 16 : 14,
                ),
              ),
            ],
          ),
          Row(
            children: [
              IconButton(
                onPressed: () {},
                icon: Icon(
                  Icons.notifications_none,
                  size: isTablet ? 28 : 24,
                ),
              ),
              IconButton(
                onPressed: () {},
                icon: Icon(
                  Icons.search,
                  size: isTablet ? 28 : 24,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(bool isTablet) {
    return Padding(
      padding: EdgeInsets.symmetric(
          horizontal: isTablet ? 32.0 : 20.0, vertical: isTablet ? 14.0 : 10.0),
      child: TextField(
        style: TextStyle(fontSize: isTablet ? 18 : 16),
        decoration: InputDecoration(
          hintText: 'Search for food',
          prefixIcon:
              Icon(Icons.search, color: Colors.grey, size: isTablet ? 28 : 24),
          filled: true,
          fillColor: Colors.grey[200],
          contentPadding: EdgeInsets.symmetric(vertical: isTablet ? 16 : 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30.0),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildPromoBanner(bool isTablet) {
    return Container(
      margin: EdgeInsets.symmetric(
          horizontal: isTablet ? 32.0 : 20.0, vertical: isTablet ? 14.0 : 10.0),
      height: isTablet ? 200 : 150,
      decoration: BoxDecoration(
        color: Colors.redAccent,
        borderRadius: BorderRadius.circular(isTablet ? 24.0 : 20.0),
        image: const DecorationImage(
          image: AssetImage("assets/images/fast_food.png"),
          fit: BoxFit.cover,
          opacity: 0.8,
        ),
      ),
      child: Center(
        child: Text(
          "Promo Spesial Hari Ini!",
          style: TextStyle(
              color: Colors.white,
              fontSize: isTablet ? 28 : 22,
              fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildCategorySection({
    required BuildContext context,
    required String title,
    required List<Product> items,
    required bool isTablet,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(
              horizontal: isTablet ? 32.0 : 20.0,
              vertical: isTablet ? 14.0 : 10.0),
          child: Text(
            title,
            style: TextStyle(
                fontSize: isTablet ? 24 : 20, fontWeight: FontWeight.bold),
          ),
        ),
        SizedBox(
          height: isTablet ? 280 : 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.only(left: isTablet ? 32.0 : 20.0),
            itemCount: items.length,
            itemBuilder: (ctx, index) {
              return _buildFoodItemCard(
                context: context,
                item: items[index],
                isTablet: isTablet,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFoodItemCard({
    required BuildContext context,
    required Product item,
    required bool isTablet,
  }) {
    final cardWidth = isTablet ? 200.0 : 150.0;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: item),
          ),
        );
      },
      child: Container(
        width: cardWidth,
        margin: EdgeInsets.only(right: isTablet ? 20.0 : 15.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(isTablet ? 20.0 : 15.0),
                child: item.imageUrl.isNotEmpty
                    ? Image.network(
                        item.imageUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Center(
                              child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                          ));
                        },
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.grey[200],
                          child: const Center(
                              child:
                                  Icon(Icons.broken_image, color: Colors.grey)),
                        ),
                      )
                    : Container(
                        color: Colors.grey[200],
                        child: const Center(
                            child: Icon(Icons.image_not_supported,
                                color: Colors.grey)),
                      ),
              ),
            ),
            SizedBox(height: isTablet ? 12 : 8),
            Text(
              item.name,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: isTablet ? 16 : 14,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              'Rp ${item.price.toStringAsFixed(0)}',
              style: TextStyle(
                color: Colors.grey[700],
                fontSize: isTablet ? 15 : 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
