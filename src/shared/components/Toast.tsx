import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { duration: 4000, ...options, id };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {typeof window !== 'undefined' && createPortal(
        <ToastContainer toasts={toasts} dismiss={dismiss} />,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col items-center gap-3 p-6 pointer-events-none pb-[calc(20px+env(safe-area-inset-bottom))]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} dismiss={() => dismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastMessage({ toast, dismiss }: { toast: ToastItem; dismiss: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (toast.duration !== Infinity && !isHovered) {
      const timer = setTimeout(() => {
        dismiss();
      }, toast.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, dismiss, isHovered]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[rgba(30,30,30,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-[20px] shadow-2xl max-w-[90vw] sm:max-w-md w-max"
    >
      {icons[toast.type]}
      <p className="text-[14px] font-medium text-white tracking-tight flex-1">
        {toast.message}
      </p>
      
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            dismiss();
          }}
          className="text-[13px] font-semibold text-[#D4FF00] hover:text-white transition-colors pl-2 shrink-0"
        >
          {toast.action.label}
        </button>
      )}
      
      {!toast.action && (
        <button onClick={dismiss} className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-colors shrink-0 opacity-50 hover:opacity-100">
          <X className="w-4 h-4 text-white" />
        </button>
      )}
    </motion.div>
  );
}
