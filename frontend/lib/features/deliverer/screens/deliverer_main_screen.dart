import 'package:flutter/material.dart';
import 'package:titipin_app/features/deliverer/screens/deliverer_dashboard_screen.dart'; // [NEW] Dashboard
import 'package:titipin_app/features/deliverer/screens/available_orders_screen.dart';
import 'package:titipin_app/features/deliverer/screens/active_orders_screen.dart';
import 'package:titipin_app/features/profile/screens/profile_view_screen.dart';
import 'package:titipin_app/features/chat/screens/deliverer_chat_list_screen.dart';

class DelivererMainScreen extends StatefulWidget {
  const DelivererMainScreen({super.key});

  @override
  State<DelivererMainScreen> createState() => _DelivererMainScreenState();
}

class _DelivererMainScreenState extends State<DelivererMainScreen> {
  int _selectedIndex = 0;

  // [UPDATED] Added dashboard as first screen
  static const List<Widget> _pages = <Widget>[
    DelivererDashboardScreen(), // Tab 0: Dashboard
    AvailableOrdersScreen(), // Tab 1: Pekerjaan tersedia
    ActiveOrdersScreen(), // Tab 2: Pekerjaan yang sedang diantar
    DelivererChatListScreen(), // Tab 3: Pesan/Chat aktif
    ProfileViewScreen(), // Tab 4: Halaman profil
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

      // [UPDATED] Added dashboard tab to bottom navigation
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Dashboard',
          ),
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
        selectedItemColor: const Color(0xFF10B981), // [UPDATED] Green color
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
      ),
    );
  }
}
