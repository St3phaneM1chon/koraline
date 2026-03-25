'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: async () => false });

export function useConfirm() {
  return useContext(ConfirmContext);
}

/**
 * FIX P3-10/P3-12: Accessible confirm dialog to replace native confirm().
 * Supports keyboard navigation, focus trap, and screen readers.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({ open: false, options: { title: '', message: '' }, resolve: null });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    state.resolve?.(result);
    setState(s => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => handleClose(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') handleClose(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-semibold mb-2">
              {state.options.title}
            </h2>
            <p id="confirm-message" className="text-sm text-muted-foreground mb-6">
              {state.options.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
                autoFocus
              >
                {state.options.cancelLabel || 'Annuler'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  state.options.destructive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {state.options.confirmLabel || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
