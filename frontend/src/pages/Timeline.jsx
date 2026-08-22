import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getClients, getEntries } from '../api/client';

function Timeline() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [entries, setEntries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getClients().then((data) => {
      setClients(data);
      if (data.length > 0) setSelectedClient(data[0]);
    });
  }, []);

  useEffect(() => {
    if (selectedClient) {
      getEntries(selectedClient.id).then(setEntries);
    }
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
        <h1 className="text-2xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>
          {selectedClient ? `${selectedClient.name} — Timeline` : 'Timeline'}
        </h1>
        <p className="text-[#6b6355] text-sm mb-6">Every request, in order, with proof of exactly what was said.</p>

        {entries.length === 0 ? (
          <p className="text-[#6b6355]">No entries logged yet for this client.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl border border-[#e8e1cf] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-[#F6F1E4] text-[#1F3D2B] font-medium capitalize mb-2">
                      {entry.entry_type?.replace('_', ' ')}
                    </span>
                    <p className="text-[#2B2620] font-medium">{entry.summary}</p>
                    {entry.due_date && (
                      <p className="text-xs text-[#6b6355] mt-1" style={{ fontFamily: 'IBM Plex Mono' }}>
                        Due {entry.due_date}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="text-xs text-[#1F3D2B] underline shrink-0"
                  >
                    {expandedId === entry.id ? 'Hide proof' : 'View proof'}
                  </button>
                </div>

                {expandedId === entry.id && (
                  <div className="mt-3 bg-[#F6F1E4] rounded-xl p-3 text-sm text-[#2B2620]">
                    <p className="text-xs text-[#6b6355] mb-1">Original message · {entry.received_at}</p>
                    "{entry.raw_text}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Timeline;  