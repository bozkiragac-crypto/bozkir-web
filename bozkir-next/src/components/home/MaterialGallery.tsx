import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GalleryShowcase } from '@/components/home/GalleryShowcase';
import { getProductsIndex, localizedCategoryName } from '@/lib/data/catalog';
import { publicUrl } from '@/lib/storage/s3';
import { fallbackCategories, primaryCategorySlugs } from '@/data/categories';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';
import { localeUrl } from '@/lib/seo';

interface ShowcaseItem {
  id: string;
  url: string;
  title: string;
  tag: string;
  href: string;
}

type IndexItem = Awaited<ReturnType<typeof getProductsIndex>>[number];

/** "LAKPANEL" / "LAK PANEL" gibi varyantları tek bir görünen ada indirger. */
function displayCategory(slug: string, raw: string, locale: Locale): string {
  const fb = fallbackCategories.find((c) => c.slug === slug);
  return fb ? localizedCategoryName(fb, locale) : raw;
}

function keyOf(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function baseName(url: string): string {
  return url.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') ?? '';
}

/** Kategori başına 2 ürün alarak çeşitli, gerçek bir vitrin sırası kurar. */
function curatedFromProducts(products: IndexItem[], locale: Locale): ShowcaseItem[] {
  const byCat = new Map<string, IndexItem[]>();
  for (const p of products) {
    if (!p.images.length || !p.name) continue;
    const list = byCat.get(p.categorySlug) ?? [];
    list.push(p);
    byCat.set(p.categorySlug, list);
  }
  for (const list of byCat.values()) list.sort((a, b) => a.code.localeCompare(b.code, 'tr'));

  const main = primaryCategorySlugs.filter((s) => byCat.has(s));
  const rest = [...byCat.keys()].filter((s) => !primaryCategorySlugs.includes(s));
  const cats = [...main, ...rest];

  const out: ShowcaseItem[] = [];
  for (let round = 0; round < 4 && out.length < 12; round++) {
    for (const slug of cats) {
      const p = byCat.get(slug)?.[round];
      if (!p) continue;
      out.push({
        id: p.id,
        url: publicUrl(p.images[0]!),
        title: p.name,
        tag: displayCategory(p.categorySlug, p.category, locale),
        href: `/urunler/${p.slug}`,
      });
      if (out.length >= 12) break;
    }
  }
  return out;
}

/**
 * "Malzeme Vitrini" — tam genişlik sinematik vitrin.
 * Admin içerik ekranından başlıklı görsel tanımlanmışsa o kullanılır;
 * aksi halde gerçek ürün kapaklarından kategori başına dengeli bir seçim yapılır.
 */
export async function MaterialGallery({ block, locale }: { block: ContentBlock; locale: Locale }) {
  const dict = dictFor(locale);
  const h = dict.home.block;
  let products: IndexItem[] = [];
  try {
    products = await getProductsIndex();
  } catch {
    products = [];
  }

  const byCode = new Map<string, IndexItem>();
  const byName = new Map<string, IndexItem>();
  for (const p of products) {
    if (p.code) byCode.set(keyOf(p.code), p);
    byName.set(keyOf(p.name), p);
  }

  const managed = block.items.filter((i) => i.imageUrl && (i.title || i.tag)).slice(0, 12);

  let items: ShowcaseItem[] = managed.map((i) => {
    const key = keyOf(baseName(i.imageUrl!));
    const product = byCode.get(key) ?? byName.get(key) ?? null;
    return {
      id: i.id,
      url: i.imageUrl!,
      title: i.title || product?.name || h.surfaceSample,
      tag: i.tag || (product ? displayCategory(product.categorySlug, product.category, locale) : ''),
      href: product ? `/urunler/${product.slug}` : `/urunler${i.tag ? `?q=${encodeURIComponent(i.tag)}` : ''}`,
    };
  });

  if (items.length < 3) items = curatedFromProducts(products, locale);

  if (items.length === 0) return null;

  return (
    <section className="py-24 md:py-32" aria-label={h.galleryAria}>
      <Container>
        <SectionHeading eyebrow={block.subtitle || h.showcase} title={block.title} body={block.body} />
      </Container>

      <GalleryShowcase items={items} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: items.map((item, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: item.title,
              url: localeUrl(locale, item.href),
            })),
          }),
        }}
      />
    </section>
  );
}
