import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getClients, getReport } from '../api/client';

function Reports() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    getClients().then((data) => {
      setClients(data);
      if (data.length > 0) setSelectedClient(data[0]);
    });
  }, []);

  useEffect(() => {
    if (selectedClient) getReport(selectedClient.id).then(setReport);
  }, [selectedClient]);

  return (
    <div className="min-h-screen bg-[#F6F1E4] flex">
      <Sidebar />

      <div className="w-64 border-r border-[#e8e1cf] p-4">
        <h2 className="text-lg text-[#1F3D2B] mb-4" style={{ fontFamily: 'Fraunces' }}>Clients</h2>
        <div className="space-y-1">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                selectedClient?.id === client.id ? 'bg-white border border-[#e8e1cf]' : 'hover:bg-white/60'
              }`}
            >
              <p className="text-sm font-medium text-[#2B2620]">{client.name}</p>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-8">
        <h1 className="text-2xl text-[#1F3D2B] mb-6" style={{ fontFamily: 'Fraunces' }}>
          {selectedClient ? `${selectedClient.name} — Report` : 'Reports'}
        </h1>

        {report && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-5">
                <p className="text-[#6b6355] text-xs mb-1">Total entries</p>
                <p className="text-2xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>{report.totalEntries}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-5">
                <p className="text-[#6b6355] text-xs mb-1">Unbilled amount</p>
                <p className="text-2xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>₹{report.totalUnbilled.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e1cf] p-5">
                <p className="text-[#6b6355] text-xs mb-1">Deadlines logged</p>
                <p className="text-2xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>{report.deadlinesTotal}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6">
              <h2 className="text-lg text-[#1F3D2B] mb-4" style={{ fontFamily: 'Fraunces' }}>All logged entries</h2>
              <div className="space-y-3">
                {report.entries.map((entry) => (
                  <div key={entry.id} className="border-b border-[#f0ebd9] pb-3 last:border-0">
                    <p className="text-sm text-[#2B2620] font-medium capitalize">{entry.entry_type?.replace('_', ' ')} — {entry.summary}</p>
                    <p className="text-xs text-[#6b6355]">{entry.due_date || 'No date'}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Reports;