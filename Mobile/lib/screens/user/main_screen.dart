import 'package:flutter/material.dart';
import 'package:titipin_app/config/colors.dart';
import 'package:titipin_app/screens/user/explore_screen.dart';
import 'package:titipin_app/screens/user/order_history_screen.dart';
import 'package:titipin_app/screens/user/cart_screen.dart';
import 'package:titipin_app/screens/user/user_chat_list_screen.dart';
import 'package:titipin_app/screens/user/profile_view_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _pages = <Widget>[
    ExploreScreen(), // Tab 0: Halaman utama
    OrderHistoryScreen(), // Tab 1: Riwayat Pesanan
    UserChatListScreen(), // Tab 2: Halaman daftar chat
    ProfileViewScreen(), // Tab 3: Halaman profil
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages.elementAt(_selectedIndex),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (context) => const CartScreen()),
          );
        },
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 4.0,
        shape: const CircleBorder(),
        child: const Icon(Icons.shopping_cart_outlined),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        color: AppColors.primary,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: <Widget>[
              _buildNavItem(icon: Icons.home, index: 0),
              _buildNavItem(icon: Icons.receipt_long, index: 1),
              const SizedBox(width: 40), // Ruang kosong untuk tombol keranjang
              _buildNavItem(icon: Icons.chat_bubble_outline, index: 2),
              _buildNavItem(icon: Icons.person_outline, index: 3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({required IconData icon, required int index}) {
    return IconButton(
      icon: Icon(
        icon,
        color: _selectedIndex == index
            ? AppColors.white
            : AppColors.white.withValues(alpha: 0.7),
        size: _selectedIndex == index ? 30 : 28,
      ),
      onPressed: () => _onItemTapped(index),
    );
  }
}
