import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Folder, FileText, ChevronRight, Home, Plus, Trash2, Eye } from 'lucide-react';

const Materials = () => {
  const [items, setItems] = useState([]);
  // FIX: Using 'root' instead of null
  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'Root' });
  const [folderHistory, setFolderHistory] = useState([{ id: 'root', name: 'Root' }]);
  
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showFileForm, setShowFileForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [fileData, setFileData] = useState({ title: '', description: '', link: '' });

  useEffect(() => {
    // This query is now perfectly stable
    const q = query(
      collection(db, 'materials'), 
      where('parentId', '==', currentFolder.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [currentFolder.id]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'materials'), {
        title: folderName,
        type: 'folder',
        parentId: currentFolder.id,
        seenBy: [],
        createdAt: serverTimestamp()
      });
      setFolderName('');
      setShowFolderForm(false);
    } catch (error) {
      alert("Error creating folder");
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    let safeUrl = fileData.link.trim();
    if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) { safeUrl = 'https://' + safeUrl; }

    try {
      await addDoc(collection(db, 'materials'), {
        title: fileData.title,
        description: fileData.description,
        link: safeUrl,
        type: 'file',
        parentId: currentFolder.id,
        seenBy: [],
        createdAt: serverTimestamp()
      });
      setFileData({ title: '', description: '', link: '' });
      setShowFileForm(false);
    } catch (error) {
      alert("Error adding file");
    }
  };

  const navigateToFolder = (folderId, folderName) => {
    const newFolder = { id: folderId, name: folderName };
    setCurrentFolder(newFolder);
    setFolderHistory([...folderHistory, newFolder]);
  };

  const navigateUp = (index) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolder(newHistory[newHistory.length - 1]);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Delete this item? If it is a folder, make sure it is empty first!')) {
      await deleteDoc(doc(db, 'materials', itemId));
    }
  };

  return (
    <div className="space-y-6 text-slate-900 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">Drive Materials</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-fit">
            {folderHistory.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <button 
                  onClick={() => navigateUp(index)}
                  className={`hover:text-blue-600 transition-colors flex items-center gap-1 ${index === folderHistory.length - 1 ? 'text-blue-600 font-bold' : ''}`}
                >
                  {index === 0 && <Home size={16} />}
                  {folder.name}
                </button>
                {index < folderHistory.length - 1 && <ChevronRight size={16} className="text-slate-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowFolderForm(!showFolderForm)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus size={18} /> New Folder
          </button>
          <button onClick={() => setShowFileForm(!showFileForm)} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus size={18} /> Add File
          </button>
        </div>
      </div>

      {showFolderForm && (
        <form onSubmit={handleCreateFolder} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
          </div>
          <button type="submit" className="bg-amber-500 text-white px-6 py-2.5 rounded-lg font-bold">Create</button>
        </form>
      )}

      {showFileForm && (
        <form onSubmit={handleCreateFile} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File Title</label>
            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none" value={fileData.title} onChange={(e) => setFileData({...fileData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Drive/Download Link</label>
            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none" value={fileData.link} onChange={(e) => setFileData({...fileData, link: e.target.value})} />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold h-fit">Upload File</button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            This folder is empty.
          </div>
        )}
        
        {items.filter(i => i.type === 'folder').map(folder => (
          <div key={folder.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer flex flex-col" onClick={() => navigateToFolder(folder.id, folder.title)}>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(folder.id); }} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
            <Folder size={48} className="text-amber-400 mb-2 mx-auto" fill="currentColor" />
            <h3 className="text-center font-semibold text-slate-800 truncate mb-2">{folder.title}</h3>
            <div className="mt-auto border-t border-slate-100 pt-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
              <Eye size={12} /> {folder.seenBy?.length || 0} views
            </div>
          </div>
        ))}

        {items.filter(i => i.type === 'file').map(file => (
          <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer flex flex-col" onClick={() => window.open(file.link, '_blank')}>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
            <FileText size={48} className="text-blue-500 mb-2 mx-auto" />
            <h3 className="text-center font-semibold text-slate-800 truncate mb-2">{file.title}</h3>
            <div className="mt-auto border-t border-slate-100 pt-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
              <Eye size={12} /> {file.seenBy?.length || 0} views
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Materials;