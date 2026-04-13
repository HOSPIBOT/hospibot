'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); onClose(); }
    catch { /* error handled by caller */ }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl disabled:opacity-60 transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for programmatic confirm dialogs
export function useConfirm() {
  const [dialog, setDialog] = useState<Omit<ConfirmDialogProps, 'onClose'> | null>(null);

  const confirm = useCallback((props: Omit<ConfirmDialogProps, 'onClose'>) => {
    setDialog(props);
  }, []);

  const close = useCallback(() => setDialog(null), []);

  const DialogComponent = dialog ? (
    <ConfirmDialog {...dialog} onClose={close} />
  ) : null;

  return { confirm, DialogComponent };
}
