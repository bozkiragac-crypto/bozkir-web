'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { track } from '@/lib/analytics';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  }, [open]);

  // Anlık öneriler: debounce + iptal edilebilir istek.
  useEffect(() => {
    if (!open || query.length < 2) {
      setResults([]);
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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('search.label')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-5">
          <Search className="h-5 w-5 text-muted-strong" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
            aria-label={t('search.label')}
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
              {recents.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => runRecent(r)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-strong transition-colors hover:border-foreground hover:text-foreground"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {query.length >= 2 && (
          <div>
            <p className="text-eyebrow px-5 pt-4">{t('search.suggestions')}</p>
            <ul className="mt-2 max-h-[46vh] overflow-y-auto pb-2">
              {loading && results.length === 0 ? (
                <li className="px-5 py-3 text-sm text-muted">{t('common.loading')}</li>
              ) : results.length === 0 ? (
                <li className="px-5 py-3 text-sm text-muted">{t('search.noResults')}</li>
              ) : (
                results.map((p) => (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => openProduct(p.slug)}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-start transition-colors hover:bg-surface-2"
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
