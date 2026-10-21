import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { QuoteForm, type QuoteProduct } from '@/components/forms/QuoteForm';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { getProductBySlug } from '@/lib/api/products';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { resolveWhatsAppTemplate, whatsappHref } from '@/lib/whatsapp';
import { pickLocaleText } from '@/lib/data/catalog';
import { Phone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = await dictForRequest(locale ?? 'tr');
  return buildMetadata({
    title: dict.quote.title,
    description: dict.quote.description,
    path: '/teklif-al',
    locale,
  });
}

export default async function QuotePage({ params, searchParams }: PageProps) {
  const [{ locale: localeParam }, sp] = await Promise.all([params, searchParams]);
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = await dictForRequest(locale ?? 'tr');
  const settings = await getSiteSettings();
  const hours = pickLocaleText(settings.hours, locale, settings.hoursEn, settings.hoursAr);
  const whatsappMessage = resolveWhatsAppTemplate(
    settings.whatsappMessages,
    locale ?? 'tr',
    'general',
  );
  const whatsappLink =
    whatsappHref(settings.whatsapp || settings.phone, whatsappMessage, settings.phone) ||
    settings.whatsapp;
  // `urun` tek ürün, `urunler` karşılaştırmadan gelen çoklu ürün slug'ları.
  const raw = [sp.urun, sp.urunler].flatMap((v) => (typeof v === 'string' ? v.split(',') : []));
  const slugs = [...new Set(raw.map((s) => s.trim()).filter(Boolean))].slice(0, 4);

  const found = slugs.length
    ? await Promise.all(slugs.map((s) => getProductBySlug(s, locale).catch(() => null)))
    : [];
  const products: QuoteProduct[] = found
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      code: product.code || undefined,
      image: product.thumbnail ?? product.images[0],
    }));

  const first = products[0];

  return (
    <>
      <PageHero
        eyebrow={dict.quote.title}
        title={
          products.length === 1 && first
            ? dict.quote.forProduct.replace('{name}', first.name)
            : products.length > 1
              ? dict.quote.combinedTitle
              : dict.quote.heading
        }
        description={dict.quote.description}
        crumbs={[
          { label: dict.common.home, href: '/' },
          ...(first
            ? [
                { label: dict.nav.products, href: '/urunler' },
                { label: first.name, href: `/urunler/${first.slug}` },
              ]
            : []),
          { label: dict.quote.title },
        ]}
      />
      <Container className="grid gap-10 pb-24 md:pb-32 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          <BrandLogo
            className="mb-6 h-12"
            alt={dict.meta.brand}
            src={settings.identity.logo}
          />
          <QuoteForm
            products={products}
            turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? ''}
            whatsappLink={whatsappLink}
          />
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-eyebrow">{dict.quote.contactTitle}</p>
            <a
              href={telHref(settings.phone)}
              className="mt-4 flex items-center gap-3 text-lg font-medium"
            >
              <Phone className="h-5 w-5" /> {settings.phone}
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 text-lg font-medium"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp
            </a>
            <p className="mt-5 text-sm text-muted-strong">{hours}</p>
          </div>
        </aside>
      </Container>
    </>
  );
}
