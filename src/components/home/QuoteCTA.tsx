import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { siteConfig } from '@/config/site';

export function QuoteCTA() {
  return (
    <Container className="pb-24 md:pb-32">
      <div className="relative overflow-hidden rounded-xl bg-foreground px-8 py-16 text-background md:px-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-headline">Projeniz için doğru malzemeyi birlikte seçelim.</h2>
          <p className="mt-5 max-w-lg text-background/70">
            Ürün kodu veya ölçüleriyle teklif isteyin; ekibimiz aynı gün içinde dönüş yapsın.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <ButtonLink href="/teklif-al" size="lg" className="bg-background text-foreground hover:bg-white">
                Teklif Al <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              href={siteConfig.phoneHref}
              size="lg"
              variant="outline"
              className="border-background/30 text-background hover:border-background hover:bg-background hover:text-foreground"
            >
              <Phone className="h-4 w-4" /> {siteConfig.phone}
            </ButtonLink>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-background/80 transition-colors hover:text-background"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
