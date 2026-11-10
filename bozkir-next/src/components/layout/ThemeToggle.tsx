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

/** Kararlı temayı DOM'a ve adres çubuğu rengine uygular. */
function applyTheme(theme: Theme, source: 'user' | 'default') {
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

/** Tema düğmesi: site varsayılanı açık temadır; kullanıcı isterse koyuya geçer. */
export function ThemeToggle({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  const { t } = useDictionary();

  useEffect(() => {
    const pref = storedPref();
    const initial = pref ?? 'light';
    setTheme(initial);
    applyTheme(initial, pref === null ? 'default' : 'user');
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      // yok say
    }
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
