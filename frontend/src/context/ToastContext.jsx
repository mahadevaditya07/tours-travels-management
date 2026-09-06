import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useMemo(() => (() => Math.random().toString(36).slice(2,9)), []);

  const showToast = useCallback((message, options = {}) => {
    const t = { id: id(), message, type: options.type || 'info', duration: options.duration || 3500 };
    setToasts(prev => [...prev, t]);
    if (t.duration > 0) setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), t.duration + 100);
    return t.id;
  }, [id]);

  const removeToast = useCallback((toastId) => setToasts(prev => prev.filter(t => t.id !== toastId)), []);

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }

export default ToastContext;
