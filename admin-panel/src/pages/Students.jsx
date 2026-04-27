import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { auth, db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Plus, Trash2, Edit, X, Key, Upload, FileSpreadsheet } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ rollNumber: '', name: '', email: '', phone: '', password: '' });
  const [excelRows, setExcelRows] = useState([]);
  const [excelError, setExcelError] = useState('');
  const [excelFileName, setExcelFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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
      } catch {
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

  const getValue = (row, keys) => {
    const normalizedRow = Object.entries(row).reduce((acc, [key, value]) => {
      const normalizedKey = key.toString().toLowerCase().replace(/[\s_-]/g, '');
      acc[normalizedKey] = value;
      return acc;
    }, {});

    for (const key of keys) {
      const value = normalizedRow[key];
      if (value !== undefined && value !== null && value.toString().trim() !== '') {
        return value.toString().trim();
      }
    }

    return '';
  };

  const normalizeExcelRow = (row) => ({
    rollNumber: getValue(row, ['rollnumber', 'rollno', 'roll', 'studentid']),
    name: getValue(row, ['name', 'fullname', 'studentname']),
    email: getValue(row, ['email', 'emailaddress']),
    phone: getValue(row, ['phone', 'phonenumber', 'mobile', 'mobilenumber']),
    password: getValue(row, ['password', 'initialpassword']),
  });

  const handleExcelChange = (event) => {
    const file = event.target.files?.[0];
    setExcelRows([]);
    setExcelError('');
    setExcelFileName(file?.name || '');

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const normalizedRows = rows.map(normalizeExcelRow);
        const validRows = normalizedRows.filter((row) =>
          row.rollNumber && row.name && row.email && row.phone && row.password.length >= 6
        );

        if (validRows.length === 0) {
          setExcelError('No valid rows found. Use columns: rollNumber, name, email, phone, password. Password must be at least 6 characters.');
          return;
        }

        setExcelRows(validRows);
        if (validRows.length !== rows.length) {
          setExcelError(`${rows.length - validRows.length} row(s) were skipped because required values were missing or password was too short.`);
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setExcelError('Could not read this file. Please upload a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportExcel = async () => {
    if (excelRows.length === 0) return;

    setIsImporting(true);
    let importedCount = 0;
    try {
      for (const row of excelRows) {
        const userCredential = await createUserWithEmailAndPassword(auth, row.email, row.password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, 'studentDetails', row.rollNumber), {
          name: row.name,
          email: row.email,
          phone: row.phone,
          rollNumber: row.rollNumber,
        });

        await setDoc(doc(db, 'users', uid), {
          rollNumber: row.rollNumber,
          email: row.email
        });

        importedCount += 1;
      }

      alert(`${importedCount} student record(s) imported successfully.`);
      setExcelRows([]);
      setExcelFileName('');
      setExcelError('');
    } catch (error) {
      alert(`Imported ${importedCount} student(s), then stopped because of an error: ${error.message}`);
    } finally {
      setIsImporting(false);
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-green-600" />
              Import Students from Excel
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Columns: rollNumber, name, email, phone, password
            </p>
          </div>
          <label className="inline-flex items-center justify-center gap-2 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload size={18} />
            {excelFileName || 'Choose Excel File'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelChange}
            />
          </label>
        </div>

        {excelError && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {excelError}
          </p>
        )}

        {excelRows.length > 0 && (
          <div className="mt-5 space-y-4">
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold">Roll Number</th>
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Phone</th>
                    <th className="p-3 font-semibold">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {excelRows.slice(0, 5).map((row, index) => (
                    <tr key={`${row.rollNumber}-${row.email}-${index}`}>
                      <td className="p-3 font-medium text-slate-900">{row.rollNumber}</td>
                      <td className="p-3 text-slate-700">{row.name}</td>
                      <td className="p-3 text-slate-700">{row.email}</td>
                      <td className="p-3 text-slate-700">{row.phone}</td>
                      <td className="p-3 text-slate-500">******</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              disabled={isImporting}
              onClick={handleImportExcel}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all font-semibold"
            >
              <Upload size={18} />
              {isImporting ? 'Importing...' : `Import ${excelRows.length} Students`}
            </button>
          </div>
        )}
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
