import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Students from './pages/Students';
import Notifications from './pages/Notifications';
import Polls from './pages/Polls';
import Marks from './pages/Marks';
import Calendar from './pages/Calendar';
import Materials from './pages/Materials';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h1 className="text-3xl font-bold text-slate-800">Welcome back, Admin!</h1>
              <p className="text-slate-500 mt-2">Select a module from the sidebar to manage your class.</p>
            </div>
          } />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/students" element={<Students />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;