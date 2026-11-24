import type Lenis from 'lenis';

/**
 * Tek Lenis örneğini paylaşmak için küçük registry.
 * SmoothScrollProvider örneği kaydeder; ScrollToTop gibi bileşenler kullanır.
 */
let instance: Lenis | null = null;
const listeners = new Set<(lenis: Lenis | null) => void>();

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
  listeners.forEach((fn) => fn(lenis));
}

export function getLenis(): Lenis | null {
  return instance;
}

export function subscribeLenis(fn: (lenis: Lenis | null) => void): () => void {
  listeners.add(fn);
  fn(instance);
  return () => {
    listeners.delete(fn);
  };
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
