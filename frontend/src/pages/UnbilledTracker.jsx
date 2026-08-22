import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getUnbilled, markBilled } from '../api/client';

function UnbilledTracker() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const load = () => {
    getUnbilled().then((data) => {
      setItems(data.items);
      setTotal(data.total);
    });
  };

  useEffect(() => { load(); }, []);

  const handleBill = async (id) => {
    await markBilled(id);
    load();
  };

  return (
    <div className="min-h-screen bg-[#F6F1E4] flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-2xl text-[#1F3D2B] mb-1" style={{ fontFamily: 'Fraunces' }}>Unbilled Work</h1>
        <p className="text-[#6b6355] text-sm mb-6">Extra work requested, not yet billed to the client.</p>

        <div className="bg-white rounded-2xl border border-[#e8e1cf] p-6 mb-6 flex items-center justify-between">
          <p className="text-[#6b6355] text-sm">Total unbilled</p>
          <p className="text-3xl text-[#1F3D2B]" style={{ fontFamily: 'Fraunces' }}>
            ₹{total.toLocaleString('en-IN')}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-[#6b6355]">Nothing unbilled right now.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#e8e1cf] p-5 flex items-center justify-between">
                <div>
                  <p className="text-[#2B2620] font-medium">{item.summary}</p>
                  <p className="text-xs text-[#6b6355]">{item.client_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#1F3D2B] font-medium">₹{item.estimated_value?.toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => handleBill(item.id)}
                    className="text-xs bg-[#1F3D2B] text-[#F6F1E4] rounded-lg px-3 py-1.5"
                  >
                    Mark billed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UnbilledTracker;