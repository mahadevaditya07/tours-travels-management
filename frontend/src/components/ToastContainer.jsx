import React from 'react';
import './ToastContainer.css';

export default function ToastContainer({ toasts = [], onClose = () => {} }) {
  return (
    <div className="toast-root" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <div className="toast-message">{t.message}</div>
          <button className="toast-close" onClick={() => onClose(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
