import React, { useEffect } from 'react';
import { useToasts } from '../context/ToastContext';
import type { ToastMessage } from '../types';

const Toast: React.FC<{ toast: ToastMessage, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onRemove]);
  
  const typeClasses = {
    success: 'bg-green-500/90 border-green-400',
    error: 'bg-red-500/90 border-red-400',
    info: 'bg-blue-500/90 border-blue-400',
    warning: 'bg-yellow-500/90 border-yellow-400',
  };
  
  const Icon = () => {
      switch(toast.type) {
          case 'success': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
          case 'error': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
          default: return null;
      }
  }

  return (
    <div
      role="alert"
      className={`relative w-full max-w-sm rounded-lg shadow-2xl p-4 mt-4 backdrop-blur-md border animate-toast-in overflow-hidden
                  flex items-start gap-3 text-white ${typeClasses[toast.type]}`}
    >
        <div className="flex-shrink-0 mt-0.5"><Icon /></div>
        <p className="flex-grow text-sm font-medium">{toast.message}</p>
        <button onClick={() => onRemove(toast.id)} className="absolute top-1 right-1 p-1 text-white/70 hover:text-white" aria-label="Close">
           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
    </div>
  );
};

const ToastsContainer: React.FC = () => {
  const { toasts, removeToast } = useToasts();

  return (
    <div aria-live="assertive" className="fixed top-4 right-4 z-[9999] w-full max-w-sm flex flex-col items-end">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastsContainer;
