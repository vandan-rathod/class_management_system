import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/app_models.dart';

class NotificationTab extends StatelessWidget {
  final String rollNumber;
  const NotificationTab({super.key, required this.rollNumber});

  void _markAsSeen(String docId, List<String> seenBy) {
    if (!seenBy.contains(rollNumber)) {
      FirebaseFirestore.instance.collection('notifications').doc(docId).update({
        'seenBy': FieldValue.arrayUnion([rollNumber])
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('notifications')
            .orderBy('timestamp', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return const Center(child: Text('Error loading data'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

          final docs = snapshot.data!.docs;
          if (docs.isEmpty) return const Center(child: Text('No notifications yet.'));

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final notif = AppNotification.fromFirestore(docs[index]);
              final isSeen = notif.seenBy.contains(rollNumber);

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                elevation: isSeen ? 1 : 3,
                child: ListTile(
                  title: Text(
                        notif.title,
                        style: TextStyle(fontWeight: isSeen ? FontWeight.normal : FontWeight.bold),
                  ),
                  subtitle: Text(notif.message),
                  trailing: isSeen
                      ? const Icon(Icons.done_all, color: Colors.blue)
                      : const Icon(Icons.circle, color: Colors.red, size: 12),
                  onTap: () => _markAsSeen(notif.id, notif.seenBy),
                ),
              );
            },
          );
        },
      ),
    );
  }
}