import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/utils/cn';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-primary/30 bg-primary/10 text-primary',
};

function ToastItem({ toast }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const Icon = icons[toast.type] || icons.info;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300 max-w-sm',
        styles[toast.type]
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium flex-1 text-white">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-white shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
