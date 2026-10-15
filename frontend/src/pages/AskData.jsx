import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { askDataQuestion } from '../api/client';
import { Loader2, Send } from 'lucide-react';

const STARTER_QUESTIONS = [
  'How much unbilled work is there right now?',
  'Which client has the most overdue deadlines?',
  'How many entries are flagged for review?',
  'Which client generates the most extra work?',
];

function AskData() {
  const showToast = useToast();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const ask = async (q) => {
    const text = q.trim();
    if (!text || loading) return;

    setLoading(true);
    setQuestion('');
    try {
      const result = await askDataQuestion(text);
      setHistory((prev) => [...prev, { id: Date.now(), question: text, ...result }]);
    } catch (err) {
      showToast(err.message || 'Could not answer that question. Try rephrasing it.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask(question);
  };

  return (
    <div className="min-h-screen bg-[#F6F1E4] flex">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col" style={{ maxHeight: '100vh' }}>
        <h1 className="text-2xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Ask Your Data</h1>
        <p className="text-[#6b6355] text-sm mb-6">
          Ask a plain-English question — it's answered live against your own clients and entries, not a canned summary.
        </p>

        {history.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="text-xs text-[#1F3D2B] bg-white border border-[#e8e1cf] rounded-full px-3 py-1.5 hover:bg-[#eee6cf] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {history.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-[#1F3D2B] text-[#F6F1E4] text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-lg">
                  {item.question}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-white border border-[#e8e1cf] rounded-2xl rounded-bl-sm px-4 py-3 max-w-xl relative">
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-[#C9A227] flex items-center justify-center rotate-6 shadow-sm">
                    <span className="text-[#1F3D2B] text-[8px] font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>LOG</span>
                  </div>
                  <p className="text-sm text-[#2B2620] mt-1">{item.answer}</p>

                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="text-[10px] text-[#6b6355] underline mt-2"
                  >
                    {expandedId === item.id ? 'Hide query' : 'Show query'}
                  </button>

                  {expandedId === item.id && (
                    <div className="mt-2 bg-[#F6F1E4] rounded-lg p-3 overflow-x-auto">
                      <p className="text-[10px] text-[#6b6355] mb-1">Generated SQL:</p>
                      <pre className="text-[10px] text-[#2B2620] whitespace-pre-wrap" style={{ fontFamily: 'IBM Plex Mono' }}>{item.sql}</pre>
                      {item.rows.length > 0 && (
                        <>
                          <p className="text-[10px] text-[#6b6355] mt-2 mb-1">Result ({item.rows.length} row{item.rows.length === 1 ? '' : 's'}):</p>
                          <pre className="text-[10px] text-[#2B2620] whitespace-pre-wrap" style={{ fontFamily: 'IBM Plex Mono' }}>{JSON.stringify(item.rows, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#e8e1cf] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#6b6355]" />
                <span className="text-sm text-[#6b6355]">Querying your data...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How much unbilled work does Meera Kapoor have?"
            className="flex-1 rounded-xl bg-white border border-[#e8e1cf] text-[#2B2620] px-4 py-2.5 outline-none focus:border-[#1F3D2B] transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-[#1F3D2B] hover:bg-[#16301F] disabled:opacity-50 text-[#F6F1E4] rounded-xl p-2.5 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </main>
    </div>
  );
}

export default AskData;
