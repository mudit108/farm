"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

type Toast = { id: number; message: string; ok: boolean };

const ToastContext = createContext<{ show: (message: string, ok?: boolean) => void }>({
  show: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Admin actions previously gave no visible feedback at all — you'd
 * click "Resend Certificate" and nothing would change on screen, so
 * there was no way to know whether it worked without checking the
 * member's inbox.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, isOk = true) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, ok: isOk }]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => setToasts((all) => all.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Errors linger longer — they're more likely to need reading twice.
    const life = toast.ok ? 3500 : 6000;
    const t1 = setTimeout(() => setLeaving(true), life);
    const t2 = setTimeout(onDone, life + 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast.ok, onDone]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 rounded-[var(--radius-sm)] border px-4 py-3 shadow-lg transition-all duration-200 ${
        leaving ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      } ${
        toast.ok
          ? "border-[var(--color-green)]/25 bg-[var(--color-green-soft)] text-[var(--color-green-deep)]"
          : "border-[var(--color-live)]/30 bg-[var(--color-live)]/10 text-[var(--color-ink)]"
      }`}
      role="status"
      aria-live="polite"
    >
      {toast.ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-live)]" />
      )}
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={onDone} className="shrink-0 opacity-50 hover:opacity-100" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
