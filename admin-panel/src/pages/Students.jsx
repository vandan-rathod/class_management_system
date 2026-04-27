import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Plus, Trash2, Edit, X, Key } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ rollNumber: '', name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'studentDetails'), (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentData);
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({ rollNumber: '', name: '', email: '', phone: '', password: '' });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const openEditModal = (student) => {
    setFormData({ 
      rollNumber: student.rollNumber || student.id, 
      name: student.name || '', 
      email: student.email || '', 
      phone: student.phone || '',
      password: '' 
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'studentDetails', formData.rollNumber), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          rollNumber: formData.rollNumber,
        });
        alert("Student updated successfully!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, 'studentDetails', formData.rollNumber), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          rollNumber: formData.rollNumber,
        });

        await setDoc(doc(db, 'users', uid), {
          rollNumber: formData.rollNumber,
          email: formData.email
        });
        alert("Student and login created successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Error: " + error.message);
    }
  };

  const handleDelete = async (rollNumber) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'studentDetails', rollNumber));
      } catch (error) {
        alert("Error deleting record.");
      }
    }
  };

  const handlePasswordReset = async (email) => {
    if (window.confirm(`Send a password reset email to ${email}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent successfully!");
      } catch (error) {
        alert("Error sending reset email: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 text-slate-900 min-h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
        >
          <Plus size={20} />
          <span>Add Student</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
            <tr>
              <th className="p-4 font-semibold">Roll Number</th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Phone</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">No students found.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors bg-white">
                  <td className="p-4 font-medium text-slate-900">{student.id}</td>
                  <td className="p-4 text-slate-700">{student.name}</td>
                  <td className="p-4 text-slate-700">{student.phone || 'N/A'}</td>
                  <td className="p-4 text-slate-700">{student.email}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handlePasswordReset(student.email)} 
                      title="Send Password Reset"
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                    >
                      <Key size={18} />
                    </button>
                    <button onClick={() => openEditModal(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                <input required disabled={isEditing} type="text" className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 outline-none disabled:bg-slate-100"
                  value={formData.rollNumber} onChange={(e) => setFormData({...formData, rollNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 outline-none"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input required type="tel" className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 outline-none"
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required disabled={isEditing} type="email" className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 outline-none disabled:bg-slate-100"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Password (Min 6 chars)</label>
                  <input required type="text" className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2.5 outline-none"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all">
                  {isEditing ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;