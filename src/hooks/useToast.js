import { useUIStore } from '../store/useUIStore';

export function useToast() {
  const addToast = useUIStore((s) => s.addToast);

  return {
    success: (message) => addToast({ type: 'success', message }),
    error: (message) => addToast({ type: 'error', message }),
    warning: (message) => addToast({ type: 'warning', message }),
    info: (message) => addToast({ type: 'info', message }),
  };
}
