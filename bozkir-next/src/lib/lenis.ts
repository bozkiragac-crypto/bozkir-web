import type Lenis from 'lenis';

/**
 * Tek Lenis örneğini paylaşmak için küçük registry.
 * SmoothScrollProvider örneği kaydeder; ScrollToTop gibi bileşenler kullanır.
 */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Sayfayı en üste kaydırır (Lenis varsa yumuşak, yoksa anında). */
export function scrollPageToTop(): void {
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(0, { immediate: false });
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
