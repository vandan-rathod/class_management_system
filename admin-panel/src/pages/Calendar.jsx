import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, Timestamp, orderBy, query } from 'firebase/firestore';
import { CalendarDays, Trash2, Send, Clock, Eye } from 'lucide-react';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', type: 'Exam' });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const firestoreTimestamp = Timestamp.fromDate(new Date(formData.date));

    try {
      await addDoc(collection(db, 'events'), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        date: firestoreTimestamp,
        seenBy: [] // NEW: Tracking who views the event
      });
      setFormData({ title: '', description: '', date: '', type: 'Exam' });
    } catch (error) {
      alert("Error saving event: " + error.message);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteDoc(doc(db, 'events', eventId));
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <CalendarDays className="text-blue-600" /> Academic Calendar
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Event Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Schedule Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input required type="date" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Event">Campus Event</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea required rows="3" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 mt-2">
              <Send size={18} /> Add to Calendar
            </button>
          </form>
        </div>

        {/* Upcoming Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">Upcoming Schedule</h2>
          {events.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">No upcoming events scheduled.</div>
          ) : (
            events.map(event => {
              const formattedDate = event.date?.toDate().toLocaleDateString('en-GB') || 'No Date';
              let typeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (event.type === 'Exam') typeColor = 'bg-red-100 text-red-700 border-red-200';
              if (event.type === 'Holiday') typeColor = 'bg-green-100 text-green-700 border-green-200';
              if (event.type === 'Deadline') typeColor = 'bg-amber-100 text-amber-700 border-amber-200';

              return (
                <div key={event.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600 h-fit"><CalendarDays size={24} /></div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">{event.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
                            <Clock size={16} className="text-slate-400" /> {formattedDate}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor}`}>{event.type}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(event.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Seen By Section */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                      <Eye size={14} /> Seen by ({event.seenBy?.length || 0}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {event.seenBy && event.seenBy.length > 0 ? (
                        event.seenBy.map((roll, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                            {roll}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No views yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;