/**
 * Sözlükten nokta ile yol okur (ör. `nav.products`).
 * Yalnızca saf fonksiyon; `dictionaries.ts`'i import etmez — böylece istemci
 * bileşenleri tüm dilleri bundle'a çekmez.
 */
export function t<T = Record<string, unknown>>(dict: T, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], dict);
  return typeof value === 'string' ? value : path;
}
