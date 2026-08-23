import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, Receipt, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Timeline', path: '/timeline', icon: Clock },
  { label: 'Unbilled Work', path: '/unbilled', icon: Receipt },
  { label: 'Reports', path: '/reports', icon: FileText },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-60 min-h-screen bg-[#1F3D2B] text-[#F6F1E4] flex flex-col py-6 px-4">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-full bg-[#C9A227] flex items-center justify-center shrink-0">
          <span className="text-[#1F3D2B] text-[10px] font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>LOG</span>
        </div>
        <span className="text-lg" style={{ fontFamily: 'Fraunces' }}>TrackItRight</span>
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