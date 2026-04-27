import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/app_models.dart';

class MarksTab extends StatelessWidget {
  final String rollNumber;
  const MarksTab({super.key, required this.rollNumber});

  void _updateMarkStatus(BuildContext context, String markId, String status, {String reason = ''}) {
    FirebaseFirestore.instance.collection('marks').doc(markId).update({
      'status': status,
      'reason': reason,
    });
    if (context.mounted && Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  void _showRejectDialog(BuildContext context, String markId) {
    final TextEditingController reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Marks'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(hintText: 'Enter reason for rejection'),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().isNotEmpty) {
                _updateMarkStatus(context, markId, 'rejected', reason: reasonController.text.trim());
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Marks')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('marks')
            .where('rollNumber', isEqualTo: rollNumber)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return const Center(child: Text('Error loading marks'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

          final docs = snapshot.data!.docs;
          if (docs.isEmpty) return const Center(child: Text('No marks uploaded yet.'));

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final mark = MarkRecord.fromFirestore(docs[index]);

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(mark.subject, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          ),
                          Text('Score: ${mark.score}', style: const TextStyle(fontSize: 18, color: Colors.blue)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Exam: ${mark.examType}'),
                      const SizedBox(height: 16),
                      if (mark.status == 'pending')
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                              onPressed: () => _updateMarkStatus(context, mark.id, 'approved'),
                              child: const Text('Approve', style: TextStyle(color: Colors.white)),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                              onPressed: () => _showRejectDialog(context, mark.id),
                              child: const Text('Reject', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(8),
                          color: mark.status == 'approved' ? Colors.green.shade100 : Colors.red.shade100,
                          child: Row(
                            children: [
                              Icon(mark.status == 'approved' ? Icons.check_circle : Icons.cancel, 
                                   color: mark.status == 'approved' ? Colors.green : Colors.red),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  mark.status == 'approved' 
                                      ? 'Marks Approved' 
                                      : 'Rejected: ${mark.reason}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}