import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { IconCheck, IconAlert, IconInfo, IconClose } from '../components/ui/Icons.jsx';

/** Toasts: small pop-up messages.   const toast = useToast();  toast.success('Saved!') */
const ToastContext = createContext(null);

const STYLES = {
  success: { box: 'border-primary bg-[#1f3306]', icon: IconCheck, color: 'text-primary-light' },
  error:   { box: 'border-danger-light bg-[#3b0d1b]', icon: IconAlert, color: 'text-danger-light' },
  info:    { box: 'border-secondary-300 bg-[#14214a]', icon: IconInfo, color: 'text-secondary-300' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), 5000);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* aria-live: screen readers announce new toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          const Icon = s.icon;
          return (
            <div key={t.id} className={`pointer-events-auto flex w-full max-w-md animate-toast-in items-start gap-3 rounded-2xl border-2 px-4 py-3 shadow-card ${s.box}`}>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.color}`} />
              <p className="flex-1 text-small text-white">{t.message}</p>
              <button type="button" onClick={() => remove(t.id)} className="rounded p-0.5 text-muted hover:text-white" aria-label="Dismiss message">
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
