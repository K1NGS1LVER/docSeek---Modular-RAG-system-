import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StatusBar from './components/StatusBar';
import Sidebar from './components/Sidebar';
import FrontPage from './pages/FrontPage';
import Overview from './pages/Overview';
import Documents from './pages/Documents';
import Pipeline from './pages/Pipeline';
import Query from './pages/Query';
import Vectors from './pages/Vectors';
import Metrics from './pages/Metrics';
import Debug from './pages/Debug';
import Settings from './pages/Settings';
import './App.css';

function AppShell() {
  const [stage, setStage] = useState(0); // 0=hidden, 1=statusbar, 2=content, 3=sidebar

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 60);    // status bar
    const t2 = setTimeout(() => setStage(2), 200);   // main content
    const t3 = setTimeout(() => setStage(3), 500);   // sidebar
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      <div
        className="transition-all duration-300 ease-out"
        style={{ opacity: stage >= 1 ? 1 : 0, transform: stage >= 1 ? 'translateY(0)' : 'translateY(-4px)' }}
      >
        <StatusBar />
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 28px)', marginTop: '28px' }}>
        <div
          className="transition-all duration-400 ease-out"
          style={{ opacity: stage >= 3 ? 1 : 0, transform: stage >= 3 ? 'translateX(0)' : 'translateX(-12px)' }}
        >
          <Sidebar />
        </div>

        <main
          className="flex-1 overflow-hidden bg-carbon transition-opacity duration-300 ease-out"
          style={{ marginLeft: '200px', opacity: stage >= 2 ? 1 : 0 }}
        >
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/query" element={<Query />} />
            <Route path="/vectors" element={<Vectors />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/app/*" element={<AppShell />} />
      </Routes>
    </Router>
  );
}

export default App;
