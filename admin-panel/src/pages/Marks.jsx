import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { GraduationCap, Trash2, CheckCircle, XCircle, Clock, Send } from 'lucide-react';

const Marks = () => {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    rollNumber: '',
    subject: '',
    examType: '',
    score: ''
  });

  // Fetch Students (for the dropdown) and Marks (for the table)
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'studentDetails'), (snapshot) => {
      setStudents(snapshot.docs.map(doc => doc.data()));
    });

    const unsubMarks = onSnapshot(collection(db, 'marks'), (snapshot) => {
      const marksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort to show newest first
      setMarks(marksData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });

    return () => {
      unsubStudents();
      unsubMarks();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'marks'), {
        rollNumber: formData.rollNumber,
        subject: formData.subject,
        examType: formData.examType,
        score: formData.score,
        status: 'pending', // Matches your Flutter logic
        reason: '',
        createdAt: serverTimestamp()
      });
      
      // Reset only subject and score to make adding multiple marks for the same exam faster
      setFormData({ ...formData, subject: '', score: '' }); 
    } catch (error) {
      alert("Error saving mark: " + error.message);
    }
  };

  const handleDelete = async (markId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteDoc(doc(db, 'marks', markId));
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <GraduationCap className="text-blue-600" /> Student Marks
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Marks Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Upload Marks</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
              <select 
                required 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formData.rollNumber} 
                onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
              >
                <option value="" disabled>Select Student</option>
                {students.map(student => (
                  <option key={student.rollNumber} value={student.rollNumber}>
                    {student.rollNumber} - {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
              <input 
                required type="text" 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formData.examType} 
                onChange={(e) => setFormData({...formData, examType: e.target.value})} 
                placeholder="e.g. Mid-Term, Final, Quiz 1" 
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input 
                  required type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                  placeholder="e.g. Mathematics" 
                />
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Score</label>
                <input 
                  required type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.score} 
                  onChange={(e) => setFormData({...formData, score: e.target.value})} 
                  placeholder="e.g. 85/100" 
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 mt-2 transition-all">
              <Send size={18} /> Publish Marks
            </button>
          </form>
        </div>

        {/* Marks History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <tr>
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Exam & Subject</th>
                  <th className="p-4 font-semibold">Score</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marks.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No marks uploaded yet.</td></tr>
                ) : (
                  marks.map((mark) => (
                    <tr key={mark.id} className="hover:bg-slate-50 transition-colors bg-white">
                      <td className="p-4 font-medium text-slate-900">{mark.rollNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{mark.subject}</p>
                        <p className="text-xs text-slate-500">{mark.examType}</p>
                      </td>
                      <td className="p-4 font-bold text-blue-600">{mark.score}</td>
                      <td className="p-4">
                        {mark.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock size={14} /> Pending
                          </span>
                        )}
                        {mark.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle size={14} /> Approved
                          </span>
                        )}
                        {mark.status === 'rejected' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              <XCircle size={14} /> Rejected
                            </span>
                            <p className="text-xs text-red-600 mt-1 italic max-w-[150px] truncate" title={mark.reason}>
                              "{mark.reason}"
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(mark.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marks;