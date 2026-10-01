'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastItem = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

/** Kısa geri bildirim mesajları için basit toast kancası. */
export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

/** Uygulama genelinde tek bir aria-live bölgesiyle toast gösterir. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string) => {
    if (!message) return;
    const id = ++idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+5.5rem)] z-[160] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-full border border-border bg-background/95 px-5 py-2.5 text-sm shadow-lg backdrop-blur"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
