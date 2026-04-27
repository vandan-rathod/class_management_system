import 'package:cloud_firestore/cloud_firestore.dart';

class AppNotification {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final List<String> seenBy;

  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.seenBy,
  });

  factory AppNotification.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return AppNotification(
      id: doc.id,
      title: data['title'] ?? '',
      message: data['message'] ?? '',
      timestamp: (data['timestamp'] as Timestamp).toDate(),
      seenBy: List<String>.from(data['seenBy'] ?? []),
    );
  }
}

class Poll {
  final String id;
  final String question;
  final List<String> options;
  final Map<String, int> results;
  final List<String> votedBy;
  final List<String> seenBy; // NEW
  final Map<String, String> userVotes;

  Poll({
    required this.id,
    required this.question,
    required this.options,
    required this.results,
    required this.votedBy,
    required this.seenBy,
    required this.userVotes,
  });

  factory Poll.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Poll(
      id: doc.id,
      question: data['question'] ?? '',
      options: List<String>.from(data['options'] ?? []),
      results: Map<String, int>.from(data['results'] ?? {}),
      votedBy: List<String>.from(data['votedBy'] ?? []),
      seenBy: List<String>.from(data['seenBy'] ?? []), // NEW
      userVotes: Map<String, String>.from(data['userVotes'] ?? {}),
    );
  }
}

class MarkRecord {
  final String id;
  final String rollNumber;
  final String subject;
  final String examType;
  final String score; // Changed from int to String
  final String status;
  final String reason;

  MarkRecord({
    required this.id,
    required this.rollNumber,
    required this.subject,
    required this.examType,
    required this.score,
    required this.status,
    required this.reason,
  });

  factory MarkRecord.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return MarkRecord(
      id: doc.id,
      rollNumber: data['rollNumber'] ?? '',
      subject: data['subject'] ?? '',
      examType: data['examType'] ?? '',
      // .toString() safely handles it whether it was saved as a number or text
      score: data['score'].toString(), 
      status: data['status'] ?? 'pending',
      reason: data['reason'] ?? '',
    );
  }
}

class AppEvent {
  final String id;
  final String title;
  final String type;
  final String description;
  final DateTime date;
  final List<String> seenBy;

  AppEvent({
    required this.id,
    required this.title,
    required this.type,
    required this.description,
    required this.date,
    required this.seenBy,
  });

  factory AppEvent.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return AppEvent(
      id: doc.id,
      title: data['title'] ?? '',
      type: data['type'] ?? '',
      description: data['description'] ?? '',
      date: (data['date'] as Timestamp).toDate(),
      seenBy: List<String>.from(data['seenBy'] ?? []),
    );
  }
}

class MaterialItem {
  final String id;
  final String title;
  final String type; // 'folder' or 'file'
  final String link; // Standardized to match React
  final String? parentId; // Tracks which folder it belongs to

  MaterialItem({
    required this.id,
    required this.title,
    required this.type,
    required this.link,
    this.parentId,
  });

  factory MaterialItem.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return MaterialItem(
      id: doc.id,
      title: data['title'] ?? 'Untitled',
      type: data['type'] ?? 'file',
      link: data['link'] ?? '', // Fix: Matches the Admin Panel
      parentId: data['parentId'],
    );
  }
}

class StudentDetail {
  final String rollNumber;
  final String name;
  final String phone;
  final String semester;

  StudentDetail({
    required this.rollNumber,
    required this.name,
    required this.phone,
    required this.semester,
  });

  factory StudentDetail.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return StudentDetail(
      rollNumber: doc.id,
      name: data['name'] ?? '',
      phone: data['phone'] ?? '',
      semester: data['semester'] ?? '',
    );
  }
}