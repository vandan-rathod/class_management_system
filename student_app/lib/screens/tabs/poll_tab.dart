import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/app_models.dart';

class PollTab extends StatelessWidget {
  final String rollNumber;
  const PollTab({super.key, required this.rollNumber});

  void _handleVote(Poll poll, String selectedOption) {
    final hasVoted = poll.votedBy.contains(rollNumber);

    if (hasVoted) {
      // User is changing their vote
      final oldOption = poll.userVotes[rollNumber];
      if (oldOption != null && oldOption != selectedOption) {
        FirebaseFirestore.instance.collection('polls').doc(poll.id).update({
          'results.$oldOption': FieldValue.increment(-1),
          'results.$selectedOption': FieldValue.increment(1),
          'userVotes.$rollNumber': selectedOption,
        });
      }
    } else {
      // User is voting for the first time
      FirebaseFirestore.instance.collection('polls').doc(poll.id).update({
        'votedBy': FieldValue.arrayUnion([rollNumber]),
        'results.$selectedOption': FieldValue.increment(1),
        'userVotes.$rollNumber': selectedOption,
      });
    }
  }

  void _markAsSeen(String pollId, List<String> seenBy) {
    if (!seenBy.contains(rollNumber)) {
      FirebaseFirestore.instance.collection('polls').doc(pollId).update({
        'seenBy': FieldValue.arrayUnion([rollNumber])
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Polls')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('polls').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return const Center(child: Text('Error loading polls'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

          final docs = snapshot.data!.docs;
          if (docs.isEmpty) return const Center(child: Text('No polls available.'));

          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final poll = Poll.fromFirestore(docs[index]);
              final hasVoted = poll.votedBy.contains(rollNumber);
              
              // Trigger read receipt
              WidgetsBinding.instance.addPostFrameCallback((_) {
                 _markAsSeen(poll.id, poll.seenBy);
              });

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        poll.question, 
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
                      ),
                      const SizedBox(height: 16),
                      if (hasVoted)
                        ...poll.options.map((option) {
                          final count = poll.results[option] ?? 0;
                          final isMyVote = poll.userVotes[rollNumber] == option;
                          
                          return InkWell(
                            onTap: () => _handleVote(poll, option),
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        Icon(
                                          isMyVote ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                          color: isMyVote ? Colors.blue : Colors.grey,
                                          size: 22,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            option,
                                            style: TextStyle(
                                              fontWeight: isMyVote ? FontWeight.bold : FontWeight.normal,
                                              color: isMyVote ? Colors.blue : Colors.black87,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text('$count votes', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                                ],
                              ),
                            ),
                          );
                        })
                      else
                        ...poll.options.map((option) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4.0),
                              child: ElevatedButton(
                                onPressed: () => _handleVote(poll, option),
                                child: Text(option),
                              ),
                            )),
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