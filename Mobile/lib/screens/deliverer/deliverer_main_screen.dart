import 'package:flutter/material.dart';
import 'package:titipin_app/screens/deliverer/deliverer_dashboard_screen.dart';
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
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DelivererDashboardScreen(),
    const AvailableOrdersScreen(),
    const ActiveOrdersScreen(),
    const DelivererChatListScreen(),
    const DelivererProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFFE53935),
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined),
            activeIcon: Icon(Icons.list_alt),
            label: 'Tersedia',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.delivery_dining_outlined),
            activeIcon: Icon(Icons.delivery_dining),
            label: 'Aktif',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_outlined),
            activeIcon: Icon(Icons.chat),
            label: 'Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outlined),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
