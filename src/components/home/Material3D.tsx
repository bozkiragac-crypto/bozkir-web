import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { Panel3D } from '@/components/three/Panel3D';

export function Material3D() {
  return (
    <Container className="py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="text-eyebrow">Panel Kesiti</p>
          <h2 className="text-headline mt-4">Malzemenin katmanlarını keşfedin.</h2>
          <p className="mt-6 max-w-lg leading-relaxed text-muted-strong">
            Paneli sürükleyerek döndürün, farklı yüzey bitişleri arasında geçiş yapın. Teknik
            detaylar ürün yönetimi bağlandığında ürün sayfalarında yer alacak.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="h-[460px] overflow-hidden rounded-xl border border-border bg-surface sm:h-[520px]">
            <Panel3D />
          </div>
        </Reveal>
      </div>
    </Container>
  );
}
