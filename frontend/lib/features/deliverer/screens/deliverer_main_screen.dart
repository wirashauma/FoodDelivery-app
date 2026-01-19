import 'package:flutter/material.dart';
import 'package:titipin_app/features/deliverer/screens/available_orders_screen.dart';
import 'package:titipin_app/features/deliverer/screens/active_orders_screen.dart'; // 1. IMPORT FILE BARU
import 'package:titipin_app/features/profile/screens/profile_view_screen.dart';
import 'package:titipin_app/features/chat/screens/deliverer_chat_list_screen.dart';

class DelivererMainScreen extends StatefulWidget {
  const DelivererMainScreen({super.key});

  @override
  State<DelivererMainScreen> createState() => _DelivererMainScreenState();
}

class _DelivererMainScreenState extends State<DelivererMainScreen> {
  int _selectedIndex = 0;

  // 2. PERBARUI DAFTAR HALAMAN (MENJADI 4 HALAMAN)
  static const List<Widget> _pages = <Widget>[
    AvailableOrdersScreen(), // Tab 0: Pekerjaan tersedia
    ActiveOrdersScreen(), // Tab 1: Pekerjaan yang sedang diantar
    DelivererChatListScreen(), // Tab 2: Pesan/Chat aktif
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

      // 3. PERBARUI BOTTOMNAVIGATIONBAR (MENJADI 4 ITEM)
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed, // Mencegah item bergeser
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined), // Ikon untuk daftar pekerjaan
            label: 'Pekerjaan',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.delivery_dining), // Ikon untuk pekerjaan aktif
            label: 'Aktif',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'Pesan',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Profil',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: const Color(0xFFE53935), // Warna item yang aktif
        unselectedItemColor: Colors.grey, // Warna item yang tidak aktif
        onTap: _onItemTapped,
      ),
    );
  }
}
