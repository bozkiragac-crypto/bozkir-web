import Link from 'next/link';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Container } from '@/components/ui/Container';

const columns = [
  {
    title: 'Ürünler',
    links: [
      { label: 'MDF Lam', href: '/kategoriler/mdflam' },
      { label: 'Lak Panel', href: '/kategoriler/lak-panel' },
      { label: 'Kapı Panel', href: '/kategoriler/kapi-panel' },
      { label: 'Suntalam', href: '/kategoriler/suntalam' },
      { label: 'Sunta', href: '/kategoriler/sunta' },
      { label: 'MDF', href: '/kategoriler/mdf' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Bayilikler', href: '/bayilikler' },
      { label: 'Katalog', href: '/katalog' },
      { label: 'İletişim', href: '/iletisim' },
      { label: 'Teklif Al', href: '/teklif-al' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] uppercase">Bozkır Ağaç Ürünleri</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-strong">
              Mobilya ve iç mekân üreticileri için panel, yüzey ve tamamlayıcı çözümler.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-strong transition-colors hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-strong transition-colors hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-muted-strong transition-colors hover:text-foreground">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-eyebrow">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-strong transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-eyebrow">İletişim</p>
            <ul className="mt-5 space-y-3 text-sm text-muted-strong">
              <li>
                <a href={siteConfig.phoneHref} className="transition-colors hover:text-foreground">
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-foreground">
                  {siteConfig.email}
                </a>
              </li>
              <li>{siteConfig.address.street}</li>
              <li>
                {siteConfig.address.postalCode} {siteConfig.address.locality} / {siteConfig.address.region}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <Link href="/kvkk" className="transition-colors hover:text-foreground">
              KVKK
            </Link>
            <Link href="/gizlilik" className="transition-colors hover:text-foreground">
              Gizlilik
            </Link>
            <Link href="/cerez-politikasi" className="transition-colors hover:text-foreground">
              Çerez Politikası
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
