import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getDashboard } from '../api/client';
import { Receipt, CalendarClock, Inbox } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const TYPE_COLORS = { deadline: '#C9A227', task: '#5B7B8C', extra_work: '#A6543A' };

function Dashboard() {
  const [data, setData] = useState({ upcomingDeadlines: [], totalUnbilled: 0, entryBreakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('Could not load dashboard data. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Dashboard</h1>
        <p className="text-[#6b6355] text-sm mb-8">Everything logged so far, at a glance.</p>

        {loading && <p className="text-[#6b6355]">Loading...</p>}
        {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#A6543A]" />
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={16} className="text-[#A6543A]" />
                  <p className="text-[#6b6355] text-sm">Unbilled work this month</p>
                </div>
                <p className="text-3xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>
                  ₹{data.totalUnbilled.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A227]" />
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock size={16} className="text-[#C9A227]" />
                  <p className="text-[#6b6355] text-sm">Deadlines in next 7 days</p>
                </div>
                <p className="text-3xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>
                  {data.upcomingDeadlines.length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 mb-6">
              <h2 className="text-lg text-[#1F3D2B] mb-4" style={{ fontFamily: 'Fraunces' }}>Upcoming deadlines</h2>

              {data.upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center text-center py-8">
                  <Inbox size={28} className="text-[#c9c2ac] mb-2" />
                  <p className="text-[#6b6355] text-sm">Nothing due in the next 7 days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingDeadlines.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b border-[#f0ebd9] pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-[#C9A227]" />
                        <div>
                          <p className="text-[#2B2620] text-sm font-medium">{entry.summary}</p>
                          <p className="text-[#6b6355] text-xs">{entry.client_name}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs text-[#1F3D2B] bg-[#F6F1E4] px-2 py-1 rounded-md"
                        style={{ fontFamily: 'IBM Plex Mono' }}
                      >
                        {entry.due_date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.entryBreakdown && data.entryBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6">
                <h2 className="text-lg text-[#1F3D2B] mb-4" style={{ fontFamily: 'Fraunces' }}>Requests by type</h2>
                <div className="flex items-center gap-6 flex-wrap">
                  <div style={{ width: 180, height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.entryBreakdown}
                          dataKey="count"
                          nameKey="entry_type"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {data.entryBreakdown.map((entry, i) => (
                            <Cell key={i} fill={TYPE_COLORS[entry.entry_type] || '#9ca3af'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {data.entryBreakdown.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLORS[entry.entry_type] || '#9ca3af' }}
                        />
                        <span className="text-[#2B2620] capitalize">{entry.entry_type.replace('_', ' ')}</span>
                        <span className="text-[#6b6355]">({entry.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;