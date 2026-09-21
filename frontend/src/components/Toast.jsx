import { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  error: { border: '#e8c3b6', icon: AlertCircle, iconColor: '#A6543A' },
  success: { border: '#bcd4c2', icon: CheckCircle2, iconColor: '#2a4d38' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => {
          const variant = VARIANTS[t.type] || VARIANTS.error;
          const Icon = variant.icon;
          return (
            <div
              key={t.id}
              className="bg-white rounded-xl border shadow-md px-4 py-3 flex items-start gap-2 animate-toast-in"
              style={{ borderColor: variant.border }}
            >
              <Icon size={16} style={{ color: variant.iconColor }} className="shrink-0 mt-0.5" />
              <p className="text-sm text-[#2B2620] flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-[#a89f8d] hover:text-[#2B2620] shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
