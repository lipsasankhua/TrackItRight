import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getClients, addClient, addEntry, addVoiceEntry } from '../api/client';

function ConversationPanel() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [rawText, setRawText] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [similarMessages, setSimilarMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientField, setNewClientField] = useState('');

  const loadClients = () => {
    getClients().then((data) => {
      setClients(data);
      if (!selectedClient && data.length > 0) setSelectedClient(data[0]);
    });
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    await addClient({ name: newClientName, company: newClientCompany, field: newClientField });
    setNewClientName('');
    setNewClientCompany('');
    setNewClientField('');
    setShowAddClient(false);
    loadClients();
  };

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!selectedClient || !rawText.trim()) return;

    setLoading(true);
    setError(null);
    setExtracted(null);
    setSimilarMessages([]);

    try {
      const result = await addEntry({ client_id: selectedClient.id, raw_text: rawText });
      setExtracted(result.extracted);
      setSimilarMessages(result.similarMessages || []);
      setRawText('');
    } catch (err) {
      setError('AI extraction failed. Check the backend terminal for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedClient) return;

    setLoading(true);
    setError(null);
    setExtracted(null);
    setSimilarMessages([]);

    try {
      const result = await addVoiceEntry(selectedClient.id, file);
      setExtracted(result.extracted);
      setSimilarMessages(result.similarMessages || []);
    } catch (err) {
      setError('Voice note processing failed. Check the backend terminal for details.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E4] flex">
      <Sidebar />

      <div className="w-72 border-r border-[#e8e1cf] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>Clients</h2>
          <button
            onClick={() => setShowAddClient(!showAddClient)}
            className="text-[#1F3D2B] bg-[#F6F1E4] hover:bg-[#eee6cf] w-7 h-7 rounded-full text-lg leading-none"
          >
            +
          </button>
        </div>

        {showAddClient && (
          <form onSubmit={handleAddClient} className="bg-white border border-[#e8e1cf] rounded-xl p-3 mb-4 space-y-2">
            <input
              placeholder="Client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full text-sm rounded-lg bg-[#F6F1E4] px-3 py-2 outline-none"
              required
            />
            <input
              placeholder="Company"
              value={newClientCompany}
              onChange={(e) => setNewClientCompany(e.target.value)}
              className="w-full text-sm rounded-lg bg-[#F6F1E4] px-3 py-2 outline-none"
            />
            <input
              placeholder="Field (e.g. Architecture)"
              value={newClientField}
              onChange={(e) => setNewClientField(e.target.value)}
              className="w-full text-sm rounded-lg bg-[#F6F1E4] px-3 py-2 outline-none"
            />
            <button type="submit" className="w-full bg-[#1F3D2B] text-[#F6F1E4] text-sm rounded-lg py-2">
              Add client
            </button>
          </form>
        )}

        <div className="space-y-1 overflow-y-auto">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                selectedClient?.id === client.id ? 'bg-white border border-[#e8e1cf]' : 'hover:bg-white/60'
              }`}
            >
              <p className="text-sm font-medium text-[#2B2620]">{client.name}</p>
              <p className="text-xs text-[#6b6355]">{client.field || client.company || '—'}</p>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-8">
        {selectedClient ? (
          <>
            <h1 className="text-2xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>{selectedClient.name}</h1>
            <p className="text-[#6b6355] text-sm mb-6">Paste a client message below, or upload a voice note.</p>

            <form onSubmit={handleExtract} className="bg-white border border-[#e8e1cf] rounded-2xl p-5 mb-6">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="e.g. We need to change the living room tiles and also add a display unit."
                rows={4}
                className="w-full rounded-xl bg-[#F6F1E4] text-[#2B2620] px-4 py-3 outline-none resize-none"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1F3D2B] hover:bg-[#16301F] disabled:opacity-50 text-[#F6F1E4] text-sm font-medium rounded-xl px-5 py-2.5 transition-colors"
                >
                  {loading ? 'Extracting...' : 'Log & extract'}
                </button>

                <label className="cursor-pointer text-sm text-[#1F3D2B] border border-[#1F3D2B] rounded-xl px-4 py-2.5 hover:bg-[#1F3D2B] hover:text-[#F6F1E4] transition-colors">
                  🎙️ Upload voice note
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </form>

            {error && (
              <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">{error}</p>
            )}

            {extracted && (
              <div className="bg-white border border-[#e8e1cf] rounded-2xl p-5 relative">
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[#C9A227] flex items-center justify-center rotate-6 shadow-md">
                  <span className="text-[#1F3D2B] text-[9px] font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>LOG</span>
                </div>

                <h3 className="text-sm text-[#6b6355] mb-3">AI extraction result</h3>

                <div className="space-y-2 text-sm">
                  <p><span className="text-[#6b6355]">Type: </span><span className="text-[#2B2620] font-medium capitalize">{extracted.entry_type?.replace('_', ' ')}</span></p>
                  <p><span className="text-[#6b6355]">Summary: </span><span className="text-[#2B2620]">{extracted.summary}</span></p>
                  {extracted.due_date && (
                    <p><span className="text-[#6b6355]">Due date: </span><span className="text-[#2B2620]" style={{ fontFamily: 'IBM Plex Mono' }}>{extracted.due_date}</span></p>
                  )}
                  {extracted.estimated_value && (
                    <p><span className="text-[#6b6355]">Estimated value: </span><span className="text-[#2B2620]">₹{extracted.estimated_value}</span></p>
                  )}
                </div>

                {similarMessages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#f0ebd9]">
                    <p className="text-xs text-[#6b6355] mb-2">⚠ Possibly related to earlier requests:</p>
                    {similarMessages.map((m, i) => (
                      <p key={i} className="text-xs text-[#2B2620] bg-[#F6F1E4] rounded-lg px-3 py-2 mb-1">
                        "{m.text}" — {Math.round(m.score * 100)}% similar
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-[#6b6355]">Add a client to get started.</p>
        )}
      </main>
    </div>
  );
}

export default ConversationPanel;