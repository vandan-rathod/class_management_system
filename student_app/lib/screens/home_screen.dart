import 'package:flutter/material.dart';
import 'tabs/notification_tab.dart';
import 'tabs/poll_tab.dart';
import 'tabs/marks_tab.dart';
import 'tabs/calendar_tab.dart';
import 'tabs/materials_tab.dart';
import 'tabs/profile_tab.dart';

class HomeScreen extends StatefulWidget {
  final String rollNumber;
  const HomeScreen({super.key, required this.rollNumber});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  late final List<Widget> _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = [
      NotificationTab(rollNumber: widget.rollNumber),
      PollTab(rollNumber: widget.rollNumber),
      MarksTab(rollNumber: widget.rollNumber),
      CalendarTab(rollNumber: widget.rollNumber),
      MaterialsTab(rollNumber: widget.rollNumber), // Pass the rollNumber!
      ProfileTab(rollNumber: widget.rollNumber),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: _tabs[_currentIndex],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.notifications), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.poll), label: 'Polls'),
          NavigationDestination(icon: Icon(Icons.grade), label: 'Marks'),
          NavigationDestination(icon: Icon(Icons.calendar_month), label: 'Calendar'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'Materials'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}