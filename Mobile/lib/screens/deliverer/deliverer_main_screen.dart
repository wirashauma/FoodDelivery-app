import 'package:flutter/material.dart';
import 'package:titipin_app/config/colors.dart';
import 'package:titipin_app/screens/deliverer/available_orders_screen.dart';
import 'package:titipin_app/screens/deliverer/active_orders_screen.dart';
import 'package:titipin_app/screens/deliverer/deliverer_profile_screen.dart';
import 'package:titipin_app/screens/deliverer/deliverer_chat_list_screen.dart';

class DelivererMainScreen extends StatefulWidget {
  const DelivererMainScreen({super.key});

  @override
  State<DelivererMainScreen> createState() => _DelivererMainScreenState();
}

class _DelivererMainScreenState extends State<DelivererMainScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _pages = <Widget>[
    AvailableOrdersScreen(), // Tab 0: Pekerjaan tersedia
    ActiveOrdersScreen(), // Tab 1: Pekerjaan yang sedang diantar
    DelivererChatListScreen(), // Tab 2: Pesan/Chat aktif
    DelivererProfileScreen(), // Tab 3: Halaman profil KHUSUS DELIVERER
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
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined),
            label: 'Pekerjaan',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.delivery_dining),
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
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.grey500,
        onTap: _onItemTapped,
      ),
    );
  }
}
