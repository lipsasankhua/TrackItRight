import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ConversationPanel from './pages/ConversationPanel';
import Timeline from './pages/Timeline';
import UnbilledTracker from './pages/UnbilledTracker';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<ConversationPanel />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/unbilled" element={<UnbilledTracker />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;