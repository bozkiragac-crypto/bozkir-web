import type Lenis from 'lenis';

/**
 * Tek Lenis örneğini paylaşmak için küçük registry.
 * SmoothScrollProvider örneği kaydeder; ScrollToTop gibi bileşenler kullanır.
 */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}

/**
 * Sayfayı en üste kaydırır. `immediate` rota/sayfa geçişlerinde kullanılır;
 * yumuşak animasyonun gezinmeyi geciktirmesini engeller.
 */
export function scrollPageToTop(immediate = false): void {
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(0, { immediate });
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
  }
}
