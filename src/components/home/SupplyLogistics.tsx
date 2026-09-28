import { Boxes, Truck, Warehouse, CreditCard, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';

const items = [
  {
    icon: Boxes,
    title: 'Güçlü Stok Yapısı',
    text: 'Aradığınız ürünleri beklemeden, hızlı ve eksiksiz şekilde temin edersiniz.',
  },
  {
    icon: Truck,
    title: 'Hızlı Tedarik',
    text: 'İşinizin aksamaması için siparişlerinizi zamanında teslim ederiz.',
  },
  {
    icon: Warehouse,
    title: 'Depo & Sevkiyat',
    text: "Antakya'daki depomuzdan bölge geneline düzenli sevkiyat.",
  },
  {
    icon: CreditCard,
    title: 'Esnek Ödeme',
    text: 'Nakit, kredi kartı ve çekle ödeme imkanıyla alışverişinizi kolaylaştırıyoruz.',
  },
];

export function SupplyLogistics() {
  return (
    <Container className="py-24 md:py-32">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="text-eyebrow">Tedarik &amp; Lojistik</p>
            <h2 className="text-headline mt-4 max-w-2xl">Stoktan sevkiyata, kesintisiz tedarik.</h2>
          </div>
          <ButtonLink href="/teklif-al" variant="outline">
            Teklif Al <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-surface p-7 md:p-8">
              <Icon className="h-5 w-5 text-accent" />
              <h3 className="mt-6 text-lg font-medium tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-strong">{item.text}</p>
            </div>
          );
        })}
      </div>

      <Reveal>
        <p className="mt-8 text-sm text-muted">
          Sipariş ve sevkiyat planlaması için{' '}
          <a href={siteConfig.phoneHref} className="text-foreground underline underline-offset-4">
            {siteConfig.phone}
          </a>{' '}
          numarasından bize ulaşabilirsiniz.
        </p>
      </Reveal>
    </Container>
  );
}
