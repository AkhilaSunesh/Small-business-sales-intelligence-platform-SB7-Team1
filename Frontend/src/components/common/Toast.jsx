import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', timeout = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    if (timeout > 0) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
    }
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ show, clear }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-sm rounded-md px-4 py-2 text-sm shadow-md ${
              t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-cyan-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node,
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Small default export for convenience
export { ToastContext };

export default ToastProvider;
