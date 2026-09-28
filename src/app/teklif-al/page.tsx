import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { siteConfig } from '@/config/site';
import { Phone, MessageCircle } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Teklif Al | Bozkır Ağaç Ürünleri',
  description: 'Ürün kodu veya ölçüleriyle teklif isteyin; ekibimiz aynı gün içinde dönüş yapsın.',
  path: '/teklif-al',
});

export default function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Teklif"
        title="Teklif alın"
        description="Formu doldurun veya doğrudan telefon/WhatsApp ile ulaşın. Aynı gün içinde dönüş yapıyoruz."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Teklif Al' },
        ]}
      />
      <Container className="grid gap-16 pb-24 md:pb-32 lg:grid-cols-[1.4fr_1fr]">
        <QuoteForm />
        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-eyebrow">Doğrudan ulaşın</p>
            <a href={siteConfig.phoneHref} className="mt-4 flex items-center gap-3 text-lg font-medium">
              <Phone className="h-5 w-5" /> {siteConfig.phone}
            </a>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 text-lg font-medium"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp
            </a>
            <p className="mt-5 text-sm text-muted-strong">{siteConfig.hours}</p>
          </div>
        </aside>
      </Container>
    </>
  );
}
