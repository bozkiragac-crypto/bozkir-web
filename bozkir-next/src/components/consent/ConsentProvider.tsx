'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'bozkir:consent';
export type ConsentValue = 'granted' | 'denied' | 'unset';

interface ConsentCtx {
  consent: ConsentValue;
  ready: boolean;
  grant: () => void;
  deny: () => void;
}

const ConsentContext = createContext<ConsentCtx | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue>('unset');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === 'granted' || v === 'denied') setConsent(v);
    } catch {
      // yok say
    }
    setReady(true);
  }, []);

  const grant = useCallback(() => {
    setConsent('granted');
    try {
      localStorage.setItem(KEY, 'granted');
    } catch {
      // yok say
    }
  }, []);

  const deny = useCallback(() => {
    setConsent('denied');
    try {
      localStorage.setItem(KEY, 'denied');
    } catch {
      // yok say
    }
  }, []);

  const value = useMemo(() => ({ consent, ready, grant, deny }), [consent, ready, grant, deny]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentCtx {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent, ConsentProvider içinde kullanılmalı.');
  return ctx;
}

/** Analytics çerezlerine izin verildi mi? (client) */
export function analyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEY) === 'granted';
  } catch {
    return false;
  }
}
