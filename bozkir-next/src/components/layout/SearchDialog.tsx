'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { track } from '@/lib/analytics';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Suggestion {
  slug: string;
  name: string;
  category: string;
  thumbnail?: string;
}

const RECENTS_KEY = 'bozkir:search-recent';
const MAX_RECENTS = 5;

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_RECENTS)
      : [];
  } catch {
    return [];
  }
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [value, setValue] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const routeParams = useParams();
  const { t } = useDictionary();
  const locale = typeof routeParams?.locale === 'string' ? routeParams.locale : 'tr';
  useFocusTrap(open, dialogRef);

  const query = value.trim();

  useEffect(() => {
    if (open) {
      setRecents(readRecents());
      const timer = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
    setValue('');
    setResults([]);
    setActive(-1);
  }, [open]);

  // Anlık öneriler: debounce + iptal edilebilir istek.
  useEffect(() => {
    if (!open || query.length < 2) {
      setResults([]);
      setActive(-1);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(query)}&limit=6&locale=${locale}`,
          {
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error('request failed');
        const data: { items?: Suggestion[] } = await res.json();
        setResults(Array.isArray(data.items) ? data.items.slice(0, 6) : []);
        setActive(-1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, locale]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Klavye ile gezilen öneriyi görünür tut.
  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`search-suggestion-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  function remember(q: string) {
    const next = [q, ...recents.filter((r) => r !== q)].slice(0, MAX_RECENTS);
    setRecents(next);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // yoksa yok say
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    track('search', { query });
    remember(query);
    onClose();
    router.push(`/${locale}/urunler?q=${encodeURIComponent(query)}`);
  }

  function openProduct(slug: string) {
    track('search_select', { slug });
    onClose();
    router.push(`/${locale}/urunler/${slug}`);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (query.length >= 2) {
      if (results.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        const product = results[active];
        if (product) openProduct(product.slug);
      }
      return;
    }
    // Sorgu kısaken son aramalar arasında ok tuşlarıyla gezinme.
    if (recents.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusRecent(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusRecent(recents.length - 1);
    }
  }

  function focusRecent(index: number) {
    document.getElementById(`search-recent-${index}`)?.focus();
  }

  function runRecent(q: string) {
    track('search', { query: q, source: 'recent' });
    remember(q);
    onClose();
    router.push(`/${locale}/urunler?q=${encodeURIComponent(q)}`);
  }

  function clearRecents() {
    setRecents([]);
    try {
      localStorage.removeItem(RECENTS_KEY);
    } catch {
      // yoksa yok say
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[180] flex items-start justify-center bg-black/40 px-4 pt-[12dvh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('search.label')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        data-search-shell
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-5">
          <Search className="h-5 w-5 text-muted-strong" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t('search.placeholder')}
            data-search-input
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
            aria-label={t('search.label')}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={query.length >= 2}
            aria-controls="search-suggestions"
            aria-activedescendant={active >= 0 ? `search-suggestion-${active}` : undefined}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('search.close')}
            className="text-muted-strong hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {query.length < 2 && recents.length > 0 && (
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">{t('search.recent')}</p>
              <button
                type="button"
                onClick={clearRecents}
                className="text-xs text-muted-strong hover:text-foreground"
              >
                {t('search.clear')}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recents.map((r, index) => (
                <button
                  key={r}
                  id={`search-recent-${index}`}
                  type="button"
                  onClick={() => runRecent(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (e.key === 'ArrowUp' && index === 0) {
                        inputRef.current?.focus();
                        return;
                      }
                      const direction = e.key === 'ArrowDown' ? 1 : -1;
                      focusRecent((index + direction + recents.length) % recents.length);
                    } else if (e.key === 'Escape') {
                      onClose();
                    }
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-strong transition-colors hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {query.length >= 2 && (
          <div role="status" aria-live="polite">
            <p className="text-eyebrow px-5 pt-4">{t('search.suggestions')}</p>
            <ul
              id="search-suggestions"
              role="listbox"
              aria-label={t('search.suggestions')}
              className="mt-2 max-h-[46vh] overflow-y-auto pb-2"
            >
              {loading && results.length === 0 ? (
                <li className="px-5 py-3 text-sm text-muted">{t('common.loading')}</li>
              ) : results.length === 0 ? (
                <li className="px-5 py-3 text-sm text-muted">{t('search.noResults')}</li>
              ) : (
                results.map((p, index) => (
                  <li key={p.slug} role="presentation">
                    <button
                      type="button"
                      id={`search-suggestion-${index}`}
                      role="option"
                      aria-selected={active === index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => openProduct(p.slug)}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-2.5 text-start transition-colors hover:bg-surface-2',
                        active === index && 'bg-surface-2',
                      )}
                    >
                      <span className="relative h-10 w-10 flex-none overflow-hidden rounded-md bg-surface-2">
                        {p.thumbnail ? (
                          <SmartImage
                            src={p.thumbnail}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block truncate text-xs text-muted">{p.category}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted">
          <span>{t('search.enterHint')}</span>
          <span className="hidden sm:inline">{t('search.escHint')}</span>
        </div>
      </form>
    </div>
  );
}
