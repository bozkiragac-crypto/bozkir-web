import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { StatsBand } from '@/components/home/StatsBand';
import { AboutTimeline } from '@/components/home/AboutTimeline';
import { QuoteCTA } from '@/components/home/QuoteCTA';

export const metadata: Metadata = buildMetadata({
  title: 'Hakkımızda | Bozkır Ağaç Ürünleri',
  description:
    "1979'a dayanan sektör tecrübesi, 2016'da kurumsallaşma. Bozkır Ağaç Ürünleri'nin hikâyesi.",
  path: '/hakkimizda',
});

const values = [
  { title: 'Güçlü Stok', text: 'Üreticilerin ihtiyaç duyduğu ürünleri beklemeden temin edilecek stok derinliği.' },
  { title: 'Hızlı Tedarik', text: 'Siparişlerin zamanında ve eksiksiz teslimi için planlı lojistik.' },
  { title: 'Güvenilir Çözüm Ortağı', text: 'Tek seferlik satış değil, uzun vadeli iş ortaklığı anlayışı.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Hakkımızda"
        title="Köklü bir tecrübe, modern bir yapı."
        description="Bozkır Ağaç Ürünleri, 1979'a dayanan ticari tecrübenin 2016'da kurumsallaşmasıyla bugünkü yapısına ulaştı."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Hakkımızda' },
        ]}
      />

      <Container className="pb-8">
        <StatsBand />
      </Container>

      <AboutTimeline />

      <Container className="pb-16">
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-lg border border-border bg-surface p-7">
              <h3 className="text-lg font-medium tracking-tight">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-strong">{v.text}</p>
            </div>
          ))}
        </div>
      </Container>

      <QuoteCTA />
    </>
  );
}
