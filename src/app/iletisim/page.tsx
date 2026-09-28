import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/config/site';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = buildMetadata({
  title: 'İletişim | Bozkır Ağaç Ürünleri',
  description: 'Bozkır Ağaç Ürünleri iletişim: telefon, WhatsApp, adres ve çalışma saatleri.',
  path: '/iletisim',
});

const items = [
  { icon: Phone, label: 'Telefon', value: siteConfig.phone, href: siteConfig.phoneHref },
  { icon: Phone, label: 'Depo', value: siteConfig.phone2 },
  { icon: MessageCircle, label: 'WhatsApp', value: 'Mesaj gönderin', href: siteConfig.whatsapp },
  { icon: Mail, label: 'E-posta', value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { icon: MapPin, label: 'Adres', value: `${siteConfig.address.street}, ${siteConfig.address.postalCode} ${siteConfig.address.locality} / ${siteConfig.address.region}` },
  { icon: Clock, label: 'Çalışma Saatleri', value: siteConfig.hours },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="İletişim"
        title="Ofis, depo ve destek"
        description="Sorularınız ve teklif talepleriniz için bize ulaşın."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'İletişim' },
        ]}
      />

      <Container className="pb-24 md:pb-32">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="h-5 w-5 text-muted-strong" />
                <p className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">{item.label}</p>
                <p className="mt-2 text-base font-medium">{item.value}</p>
              </>
            );
            return item.href ? (
              <a key={item.label} href={item.href} className="bg-surface p-7 transition-colors hover:bg-surface-2">
                {content}
              </a>
            ) : (
              <div key={item.label} className="bg-surface p-7">
                {content}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href="/teklif-al" size="lg">
            Teklif Al
          </ButtonLink>
          <ButtonLink href={siteConfig.whatsapp} size="lg" variant="outline">
            WhatsApp ile yaz
          </ButtonLink>
        </div>

        <div className="mt-16 overflow-hidden rounded-lg border border-border">
          <iframe
            title="Bozkır Ağaç Ürünleri konum"
            src="https://www.google.com/maps?q=G%C3%BCzelbur%C3%A7%20Mah%20Yunus%20Emre%20Cad%20No:10%2FC%20Antakya%20Hatay&output=embed"
            className="h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </>
  );
}
