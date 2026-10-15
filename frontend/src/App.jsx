import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { isAuthenticated } from './api/client';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ConversationPanel from './pages/ConversationPanel';
import Timeline from './pages/Timeline';
import UnbilledTracker from './pages/UnbilledTracker';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import AskData from './pages/AskData';

// Keeps signed-out visitors off every data page — without this, someone
// could open /dashboard directly and see a blank or broken page instead of
// being sent to sign in.
function RequireAuth({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/clients" element={<RequireAuth><ConversationPanel /></RequireAuth>} />
          <Route path="/timeline" element={<RequireAuth><Timeline /></RequireAuth>} />
          <Route path="/unbilled" element={<RequireAuth><UnbilledTracker /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="/insights" element={<RequireAuth><Insights /></RequireAuth>} />
          <Route path="/ask" element={<RequireAuth><AskData /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
