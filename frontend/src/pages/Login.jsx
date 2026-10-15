import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { login } from '../api/client';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E4] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-[#e8e1cf] p-10 w-full max-w-sm relative">

        {/* signature stamp mark */}
        <div className="absolute -top-5 -right-5 w-14 h-14 rounded-full bg-[#C9A227] flex items-center justify-center rotate-6 shadow-md">
          <span className="text-[#1F3D2B] text-xs font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>LOG</span>
        </div>

        <h1 className="text-3xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>TrackItRight</h1>
        <p className="text-[#6b6355] text-sm mb-8">Every request, logged and proven.</p>

        {error && (
          <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#2B2620] text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-[#F6F1E4] text-[#2B2620] px-4 py-2.5 outline-none border border-transparent focus:border-[#1F3D2B] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[#2B2620] text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-[#F6F1E4] text-[#2B2620] px-4 py-2.5 outline-none border border-transparent focus:border-[#1F3D2B] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1F3D2B] hover:bg-[#16301F] disabled:opacity-50 text-[#F6F1E4] font-medium rounded-xl py-2.5 transition-colors mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6b6355] mt-4">
          No account? <Link to="/signup" className="text-[#1F3D2B] font-medium underline">Sign up</Link>
        </p>

        <p className="text-center text-xs text-[#a89f8d] mt-3">
          Demo: demo@trackitright.app / demo1234
        </p>

        <p className="text-center text-xs text-[#8a8171] mt-6">
  Developed by Lipsa Sankhua · Built during internship at Talking Crooks IT Pvt. Ltd.
        </p>
      </div>
    </div>
  );
}

export default Login;
