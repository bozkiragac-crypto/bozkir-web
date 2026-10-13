'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

type Theme = 'light' | 'dark';

function storedPref(): Theme | null {
  try {
    const v = localStorage.getItem('theme');
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Kararlı temayı DOM'a ve adres çubuğu rengine uygular. */
function applyTheme(theme: Theme, source: 'user' | 'system') {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  root.dataset.themeSource = source;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', theme === 'dark' ? '#0e0e10' : '#f7f7f5');
}

/** Tema düğmesi: kayıtlı tercih yoksa işletim sistemi temasını canlı takip eder. */
export function ThemeToggle({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  // Kayıtlı tercih yokken sistem teması değişimini izle.
  const [followSystem, setFollowSystem] = useState(false);
  const { t } = useDictionary();

  useEffect(() => {
    const pref = storedPref();
    const initial = pref ?? systemTheme();
    setTheme(initial);
    setFollowSystem(pref === null);
    applyTheme(initial, pref === null ? 'system' : 'user');
  }, []);

  useEffect(() => {
    if (!followSystem) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next: Theme = mq.matches ? 'dark' : 'light';
      applyTheme(next, 'system');
      setTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [followSystem]);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      // yok say
    }
    setFollowSystem(false);
    applyTheme(next, 'user');
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('nav.themeToggle')}
      aria-pressed={theme === 'dark'}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
        onDark ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-surface-2',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
