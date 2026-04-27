import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { BarChart3, Trash2, Plus, X, Send, Eye } from 'lucide-react';

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'polls'), (snapshot) => {
      const pollData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPolls(pollData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });
    return () => unsubscribe();
  }, []);

  const handleAddOption = () => setOptions([...options, '']);
  
  const handleRemoveOption = (index) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const createPoll = async (e) => {
    e.preventDefault();
    const validOptions = options.map(opt => opt.trim()).filter(opt => opt !== '');
    if (validOptions.length < 2) return alert("Please provide at least 2 valid options.");

    const initialResults = {};
    validOptions.forEach(opt => initialResults[opt] = 0);

    try {
      await addDoc(collection(db, 'polls'), {
        question: question.trim(),
        options: validOptions,
        results: initialResults,
        votedBy: [],
        seenBy: [], // NEW: Tracks who viewed it
        userVotes: {}, // NEW: Maps rollNumber -> selectedOption
        createdAt: serverTimestamp()
      });
      setQuestion('');
      setOptions(['', '']);
    } catch (error) {
      alert("Error creating poll: " + error.message);
    }
  };

  const handleDelete = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      await deleteDoc(doc(db, 'polls', pollId));
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <BarChart3 className="text-blue-600" /> Live Polls
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Poll Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Create New Poll</h2>
          <form onSubmit={createPoll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
              <textarea 
                required rows="3" 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={question} onChange={(e) => setQuestion(e.target.value)} 
                placeholder="e.g. Which framework should we learn next?" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Options</label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    required type="text" 
                    className="flex-1 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={option} onChange={(e) => handleOptionChange(index, e.target.value)} 
                    placeholder={`Option ${index + 1}`} 
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => handleRemoveOption(index)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddOption} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-50">
              <Plus size={18} /> Add Option
            </button>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 mt-4">
              <Send size={18} /> Publish Poll
            </button>
          </form>
        </div>

        {/* Live Polls List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">Active Polls</h2>
          {polls.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">No active polls.</div>
          ) : (
            polls.map(poll => {
              const totalVotes = poll.votedBy?.length || 0;
              const seenByCount = poll.seenBy?.length || 0;
              const userVotesMap = poll.userVotes || {};

              return (
                <div key={poll.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{poll.question}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium text-blue-600">Total Votes: {totalVotes}</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1"><Eye size={14} /> Seen by: {seenByCount}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(poll.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Options Breakdown */}
                  <div className="space-y-4 mt-6 border-t border-slate-100 pt-4">
                    {poll.options.map((option, idx) => {
                      const votes = poll.results?.[option] || 0;
                      const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                      
                      // Find which roll numbers voted for THIS specific option
                      const votersForThisOption = Object.entries(userVotesMap)
                        .filter(([roll, opt]) => opt === option)
                        .map(([roll]) => roll);

                      return (
                        <div key={idx} className="relative">
                          <div className="flex justify-between items-end mb-1 text-sm">
                            <span className="font-medium text-slate-800">{option}</span>
                            <span className="text-slate-500 font-medium">{votes} votes ({percentage}%)</span>
                          </div>
                          <div className="overflow-hidden h-2.5 flex rounded-full bg-slate-100 mb-2">
                            <div style={{ width: `${percentage}%` }} className="bg-blue-500 rounded-full transition-all duration-500"></div>
                          </div>
                          {/* Show roll numbers who voted for this option */}
                          {votersForThisOption.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {votersForThisOption.map(roll => (
                                <span key={roll} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                  {roll}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* People who saw but didn't vote */}
                  <div className="mt-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Seen by (All):</p>
                    <div className="flex flex-wrap gap-1">
                      {poll.seenBy && poll.seenBy.length > 0 ? (
                        poll.seenBy.map((roll, idx) => {
                          const hasVoted = poll.votedBy?.includes(roll);
                          return (
                            <span key={idx} className={`px-2 py-0.5 rounded text-xs font-medium border ${hasVoted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {roll} {hasVoted ? '✓' : ''}
                            </span>
                          );
                        })
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

export default Polls;