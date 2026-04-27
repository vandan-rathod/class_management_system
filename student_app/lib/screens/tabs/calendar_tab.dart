import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../models/app_models.dart';

class CalendarTab extends StatefulWidget {
  final String rollNumber;
  const CalendarTab({super.key, required this.rollNumber});

  @override
  State<CalendarTab> createState() => _CalendarTabState();
}

class _CalendarTabState extends State<CalendarTab> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  // Helper to normalize date (strip time) for calendar map
  DateTime _normalizeDate(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  void _markAsSeen(String eventId, List<String> seenBy) {
    if (!seenBy.contains(widget.rollNumber)) {
      FirebaseFirestore.instance.collection('events').doc(eventId).update({
        'seenBy': FieldValue.arrayUnion([widget.rollNumber])
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calendar & Events')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('events').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return const Center(child: Text('Error loading events'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

          // Group events by date
          Map<DateTime, List<AppEvent>> eventsMap = {};
          for (var doc in snapshot.data!.docs) {
            AppEvent event = AppEvent.fromFirestore(doc);
            DateTime normalizedDate = _normalizeDate(event.date);
            
            if (eventsMap[normalizedDate] == null) {
              eventsMap[normalizedDate] = [];
            }
            eventsMap[normalizedDate]!.add(event);
          }

          // Get events for the currently selected day
          List<AppEvent> selectedEvents = [];
          if (_selectedDay != null) {
            selectedEvents = eventsMap[_normalizeDate(_selectedDay!)] ?? [];
            
            // Mark these events as seen when the user clicks on the day
            for (var event in selectedEvents) {
              _markAsSeen(event.id, event.seenBy);
            }
          }

          return Column(
            children: [
              TableCalendar(
                firstDay: DateTime.utc(2020, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedDay = focusedDay;
                  });
                },
                // This puts the little dots under dates with events
                eventLoader: (day) => eventsMap[_normalizeDate(day)] ?? [],
                calendarStyle: const CalendarStyle(
                  markerDecoration: BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
                  selectedDecoration: BoxDecoration(color: Colors.blueAccent, shape: BoxShape.circle),
                  todayDecoration: BoxDecoration(color: Colors.orangeAccent, shape: BoxShape.circle),
                ),
                headerStyle: const HeaderStyle(
                  formatButtonVisible: false,
                  titleCentered: true,
                ),
              ),
              const Divider(height: 1, thickness: 1),
              const SizedBox(height: 8),
              
              // Display selected events below the calendar
              Expanded(
                child: selectedEvents.isEmpty
                    ? const Center(child: Text('No events for this day.', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        itemCount: selectedEvents.length,
                        itemBuilder: (context, index) {
                          final event = selectedEvents[index];
                          
                          Color iconColor = Colors.blue;
                          if (event.type == 'Exam') iconColor = Colors.red;
                          if (event.type == 'Holiday') iconColor = Colors.green;
                          if (event.type == 'Deadline') iconColor = Colors.orange;

                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            child: ListTile(
                              leading: Icon(Icons.event, color: iconColor, size: 36),
                              title: Text(event.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(event.description),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Type: ${event.type}', 
                                    style: TextStyle(color: iconColor, fontWeight: FontWeight.w600, fontSize: 12)
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}