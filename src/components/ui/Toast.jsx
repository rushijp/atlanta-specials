import { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-wine-50 border-wine-200 text-wine-800',
};

const ICON_STYLES = {
  success: 'bg-green-100 text-green-600',
  error: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-wine-100 text-wine-600',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur ?? 6000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lifted animate-fade-in min-w-[280px] max-w-[420px] ${STYLES[t.type]}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${ICON_STYLES[t.type]}`}>
                <Icon size={14} />
              </div>
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-current opacity-40 hover:opacity-70 transition-opacity flex-shrink-0"
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
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
