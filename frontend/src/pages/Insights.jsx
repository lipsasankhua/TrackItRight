import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getInsights } from '../api/client';
import { TrendingUp, AlertTriangle, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const STATUS_COLORS = { overdue: '#A6543A', upcoming: '#5B7B8C' };

function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInsights()
      .then(setData)
      .catch(() => setError('Could not load insights data. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const topScopeCreepClient = data?.scopeCreepByClient?.[0];

  const statusData = data
    ? [
        { key: 'overdue', label: 'Overdue', count: data.deadlineStatus.overdue },
        { key: 'upcoming', label: 'Upcoming', count: data.deadlineStatus.upcoming },
      ].filter((s) => s.count > 0)
    : [];

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Insights</h1>
        <p className="text-[#6b6355] text-sm mb-8">Trends across every client — where scope creep and deadline risk are building up.</p>

        {loading && <p className="text-[#6b6355]">Loading...</p>}
        {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#A6543A]" />
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-[#A6543A]" />
                  <p className="text-[#6b6355] text-sm">Current unbilled backlog</p>
                </div>
                <p className="text-3xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>
                  ₹{data.unbilledBacklogByWeek.reduce((s, w) => s + w.total, 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A227]" />
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-[#C9A227]" />
                  <p className="text-[#6b6355] text-sm">Overdue deadlines</p>
                </div>
                <p className="text-3xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>
                  {data.deadlineStatus.overdue}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#5B7B8C]" />
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-[#5B7B8C]" />
                  <p className="text-[#6b6355] text-sm">Most scope creep from</p>
                </div>
                <p className="text-xl text-[#1F3D2B] truncate" style={{ fontFamily: 'Fraunces' }}>
                  {topScopeCreepClient ? topScopeCreepClient.client_name.trim() : '—'}
                </p>
                {topScopeCreepClient && (
                  <p className="text-xs text-[#6b6355] mt-1">{topScopeCreepClient.extra_work_count} extra-work requests</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 mb-6">
              <h2 className="text-lg text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Unbilled backlog by week logged</h2>
              <p className="text-xs text-[#6b6355] mb-4">Of everything still unbilled right now, when did it originally come in? Tall recent bars mean backlog is fresh; tall old bars mean it's aging.</p>

              {data.unbilledBacklogByWeek.length === 0 ? (
                <p className="text-[#6b6355] text-sm py-6 text-center">No unbilled extra work logged yet.</p>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.unbilledBacklogByWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ebd9" vertical={false} />
                      <XAxis dataKey="week_start" tick={{ fontSize: 11, fill: '#6b6355' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b6355' }} />
                      <Tooltip
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Unbilled']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e8e1cf', fontSize: 12 }}
                      />
                      <Bar dataKey="total" fill="#A6543A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6">
                <h2 className="text-lg text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Scope creep by client</h2>
                <p className="text-xs text-[#6b6355] mb-4">Clients generating the most extra (unscoped) work requests.</p>

                {data.scopeCreepByClient.length === 0 ? (
                  <p className="text-[#6b6355] text-sm py-6 text-center">No extra work logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.scopeCreepByClient.map((c) => (
                      <div key={c.client_id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#2B2620] font-medium">{c.client_name.trim()}</span>
                          <span className="text-[#6b6355]">{c.extra_work_count} requests · ₹{c.total_value.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full h-2 bg-[#F6F1E4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A6543A] rounded-full"
                            style={{
                              width: `${(c.extra_work_count / data.scopeCreepByClient[0].extra_work_count) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6">
                <h2 className="text-lg text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Deadline status</h2>
                <p className="text-xs text-[#6b6355] mb-4">Overdue vs. upcoming, across all clients. (No completion tracking yet, so this is a snapshot, not an on-time rate.)</p>

                {statusData.length === 0 ? (
                  <p className="text-[#6b6355] text-sm py-6 text-center">No deadlines logged yet.</p>
                ) : (
                  <div className="flex items-center gap-6 flex-wrap">
                    <div style={{ width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={38} outerRadius={65} paddingAngle={3}>
                            {statusData.map((s, i) => (
                              <Cell key={i} fill={STATUS_COLORS[s.key]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {statusData.map((s) => (
                        <div key={s.key} className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.key] }} />
                          <span className="text-[#2B2620]">{s.label}</span>
                          <span className="text-[#6b6355]">({s.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {data.overdueDeadlines.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6">
                <h2 className="text-lg text-[#1F3D2B] mb-4" style={{ fontFamily: 'Fraunces' }}>Overdue deadlines</h2>
                <div className="space-y-3">
                  {data.overdueDeadlines.map((d) => (
                    <div key={d.id} className="flex items-center justify-between border-b border-[#f0ebd9] pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-[#A6543A]" />
                        <div>
                          <p className="text-[#2B2620] text-sm font-medium">{d.summary}</p>
                          <p className="text-[#6b6355] text-xs">{d.client_name.trim()}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs text-[#A6543A] bg-[#F6F1E4] px-2 py-1 rounded-md"
                        style={{ fontFamily: 'IBM Plex Mono' }}
                      >
                        {d.due_date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Insights;
