import 'package:flutter/material.dart';
import 'package:titipin_app/data/models/product_model.dart';
import 'package:titipin_app/features/explore/screens/product_detail_screen.dart';
import 'package:http/http.dart' as http; // <-- [MODIFIKASI]: TAMBAHKAN IMPORT
import 'dart:convert'; // <-- [MODIFIKASI]: TAMBAHKAN IMPORT
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  final List<String> categories = const [
    "Makanan",
    "Minuman",
    "Snack",
    "Buah"
  ]; //

  // [MODIFIKASI]: Fungsi simulasi diganti dengan pemanggilan API
  Future<List<Product>> _fetchProductsFromApi() async {
    // Menggunakan API Config terpusat
    final url = Uri.parse(ApiConfig.productsEndpoint);

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        // API mengembalikan List
        final List<dynamic> jsonData = json.decode(response.body);

        // Terjemahkan JSON dari backend (nama, harga) ke model Product (name, price)
        List<Product> products = jsonData.map((data) {
          return Product(
            // Pastikan ID di model Anda String, karena backend mengirim Int
            id: data['id'].toString(),

            // TERJEMAHAN:
            name: data['nama'], // 'nama' (backend) -> 'name' (model)
            price: (data['harga'] as int)
                .toDouble(), // 'harga' (backend) -> 'price' (model)
            description: data[
                'deskripsi'], // 'deskripsi' (backend) -> 'description' (model)
            category:
                data['kategori'], // 'kategori' (backend) -> 'category' (model)

            imageUrl: data['imageUrl'],

            // Data ini belum ada di DB, kita beri nilai default
            // averageRating: 0.0,
            ratingCount: 0,
          );
        }).toList();

        return products;
      } else {
        // Gagal mengambil data dari server
        throw Exception('Gagal memuat produk: ${response.statusCode}');
      }
    } catch (e) {
      // Gagal terhubung ke server
      throw Exception('Error koneksi: ${e.toString()}');
    }
  }
  // --- AKHIR MODIFIKASI ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              _buildSearchBar(),
              _buildPromoBanner(),
              const SizedBox(height: 20),

              // [MODIFIKASI]: Ganti 'future'
              FutureBuilder<List<Product>>(
                future: _fetchProductsFromApi(), // <-- Panggil fungsi API baru
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
                      );
                    }).toList(),
                  );
                },
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  // --- Sisa Widget (Header, Search, Banner, etc.) tidak perlu diubah ---
  // ... (Salin semua fungsi _buildHeader, _buildSearchBar,
  //      _buildPromoBanner, _buildCategorySection,
  //      dan _buildFoodItemCard dari file asli Anda) ...

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("What we offer",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text("Our menu that we provide",
                  style: TextStyle(color: Colors.grey)),
            ],
          ),
          Row(
            children: [
              IconButton(
                  onPressed: () {}, icon: const Icon(Icons.notifications_none)),
              IconButton(onPressed: () {}, icon: const Icon(Icons.search)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search for food',
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          filled: true,
          fillColor: Colors.grey[200],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30.0),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildPromoBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
      height: 150,
      decoration: BoxDecoration(
        color: Colors.redAccent,
        borderRadius: BorderRadius.circular(20.0),
        image: const DecorationImage(
          image: AssetImage("assets/images/fast_food.png"),
          fit: BoxFit.cover,
          opacity: 0.8,
        ),
      ),
      child: const Center(
        child: Text(
          "Promo Spesial Hari Ini!",
          style: TextStyle(
              color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildCategorySection(
      {required BuildContext context,
      required String title,
      required List<Product> items}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
          child: Text(title,
              style:
                  const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ),
        SizedBox(
          height: 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(left: 20.0),
            itemCount: items.length,
            itemBuilder: (ctx, index) {
              return _buildFoodItemCard(context: context, item: items[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFoodItemCard(
      {required BuildContext context, required Product item}) {
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
        width: 150,
        margin: const EdgeInsets.only(right: 15.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15.0),
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
            const SizedBox(height: 8),
            Text(item.name,
                style: const TextStyle(fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis),
            Text(
              'Rp ${item.price.toStringAsFixed(0)}',
              style: TextStyle(color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }
}
