'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Tarayıcı adres çubuğu rengini aktif temayla eşitler. */
function syncThemeColor(theme: Theme) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', theme === 'dark' ? '#0e0e10' : '#f7f7f5');
}

export function ThemeToggle({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const [theme, setTheme] = useState<Theme>('light');
  const { t } = useDictionary();

  useEffect(() => {
    const initial = currentTheme();
    setTheme(initial);
    syncThemeColor(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // yok say
    }
    syncThemeColor(next);
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
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
