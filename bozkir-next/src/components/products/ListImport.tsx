'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Share2, Link2, Check } from 'lucide-react';
import { useFavorites, type ProductRef } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { track } from '@/lib/analytics';

/** URL'deki `?liste=slug,slug` ürünlerini çekip hedef listeye aktarır; sonra parametreyi temizler. */
export function useImportFromUrl(target: 'favorites' | 'compare'): { imported: number; ready: boolean } {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const routeParams = useParams();
  const locale = typeof routeParams?.locale === 'string' ? routeParams.locale : 'tr';
  const { importRefs, ready } = useFavorites();
  const [imported, setImported] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (!ready || ran.current) return;
    const raw = params.get('liste');
    if (!raw) return;
    ran.current = true;

    const slugs = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 24);
    if (slugs.length === 0) return;

    Promise.all(
      slugs.map((slug) =>
        fetch(`/api/product?slug=${encodeURIComponent(slug)}&locale=${locale}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      const refs: ProductRef[] = [];
      for (const p of results) {
        if (!p || typeof p.slug !== 'string') continue;
        refs.push({
          id: p.id,
          slug: p.slug,
          name: p.name,
          code: p.code || undefined,
          category: p.category,
          face: p.face || undefined,
          image: p.thumbnail ?? p.images?.[0],
        });
      }
      importRefs(refs, target);
      setImported(refs.length);

      // URL'i temizle (tekrar eklememek için).
      const sp = new URLSearchParams(params.toString());
      sp.delete('liste');
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { imported, ready };
}

/** Liste paylaşımı: `?liste=slug,...` bağlantısını kopyalar / yerel paylaşır. */
export function ShareListButton({ slugs }: { slugs: string[] }) {
  const { t, dict, locale } = useDictionary();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const buildUrl = () => {
    const sp = new URLSearchParams();
    if (slugs.length) sp.set('liste', slugs.join(','));
    return `${window.location.origin}/${locale}${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
  };

  async function share() {
    if (slugs.length === 0) return;
    track('share', { channel: 'list', scope: pathname });
    const url = buildUrl();
    if (canNative) {
      try {
        await navigator.share({ title: dict.favorites.shareList, url });
        return;
      } catch {
        // iptal / desteklenmedi → kopyala
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // yok say
    }
  }

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted-strong transition hover:border-foreground hover:text-foreground';

  return (
    <button type="button" onClick={share} disabled={slugs.length === 0} className={btn} title={t('favorites.shareListHint')}>
      {copied ? <Check className="h-4 w-4 text-green-600" /> : canNative ? <Share2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? t('common.copied') : t('favorites.shareList')}
    </button>
  );
}
