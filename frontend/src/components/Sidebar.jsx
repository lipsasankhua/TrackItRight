import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, Receipt, FileText, BarChart3, Search } from 'lucide-react';
import { searchAll } from '../api/client';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Timeline', path: '/timeline', icon: Clock },
  { label: 'Unbilled Work', path: '/unbilled', icon: Receipt },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Insights', path: '/insights', icon: BarChart3 },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      searchAll(term).then((data) => {
        setResults(data);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToClient = (clientId, entryId) => {
    setQuery('');
    setResults(null);
    setOpen(false);
    navigate(`/timeline?client=${clientId}${entryId ? `&entry=${entryId}` : ''}`);
  };

  const hasResults = results && (results.clients.length > 0 || results.entries.length > 0);

  return (
    <div className="w-60 min-h-screen bg-[#1F3D2B] text-[#F6F1E4] flex flex-col py-6 px-4">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-full bg-[#C9A227] flex items-center justify-center shrink-0">
          <span className="text-[#1F3D2B] text-[10px] font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>LOG</span>
        </div>
        <span className="text-lg" style={{ fontFamily: 'Fraunces' }}>TrackItRight</span>
      </div>

      <div className="relative mb-6 px-2" ref={containerRef}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ca592]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Search clients, messages..."
            className="w-full bg-[#16301F] text-[#F6F1E4] placeholder-[#7a917f] text-xs rounded-lg pl-8 pr-3 py-2 outline-none border border-transparent focus:border-[#3a5f47]"
          />
        </div>

        {open && results && (
          <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-xl border border-[#e8e1cf] shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
            {!hasResults ? (
              <p className="text-xs text-[#6b6355] px-3 py-3">No matches for "{query.trim()}".</p>
            ) : (
              <>
                {results.clients.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#a89f8d] px-3 pt-2.5 pb-1">Clients</p>
                    {results.clients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => goToClient(c.id)}
                        className="w-full text-left px-3 py-2 hover:bg-[#F6F1E4] transition-colors"
                      >
                        <p className="text-sm text-[#2B2620] font-medium">{c.name}</p>
                        <p className="text-xs text-[#6b6355]">{c.field || c.company || '—'}</p>
                      </button>
                    ))}
                  </div>
                )}

                {results.entries.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#a89f8d] px-3 pt-2.5 pb-1">Messages</p>
                    {results.entries.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => goToClient(e.client_id, e.id)}
                        className="w-full text-left px-3 py-2 hover:bg-[#F6F1E4] transition-colors"
                      >
                        <p className="text-sm text-[#2B2620] font-medium truncate">{e.summary}</p>
                        <p className="text-xs text-[#6b6355]">{e.client_name?.trim()} · <span className="capitalize">{e.entry_type?.replace('_', ' ')}</span></p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-[#F6F1E4] text-[#1F3D2B] font-medium' : 'text-[#d8d3c2] hover:bg-[#2a4d38]'
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6 border-t border-[#2a4d38]">
  <p className="text-[10px] text-[#8ca592] leading-relaxed mb-2">
    Every request, timestamped and proven.
  </p>
  <p className="text-[10px] text-[#8ca592] leading-relaxed">
    Developed by Lipsa Sankhua<br />
    Built during internship at Talking Crooks IT Pvt. Ltd.
  </p>
</div>
    </div>
  );
}

export default Sidebar;