import type { NavSettingItem } from '@/lib/data/settings';

/**
 * Nav sırasını/görünürlüğünü korur; href'leri bilinen rotalardan sabitler.
 * Bilinmeyen/tekrarlı anahtarlar ve boş liste güvenli varsayılana döner.
 */
export function sanitizeNav(
  input: NavSettingItem[] | undefined,
  fallback: NavSettingItem[],
): NavSettingItem[] {
  const byKey = new Map(fallback.map((item) => [item.key, item]));
  const seen = new Set<string>();
  const out: NavSettingItem[] = [];
  for (const item of input ?? []) {
    const known = byKey.get(String(item.key));
    if (!known || seen.has(known.key)) continue;
    seen.add(known.key);
    out.push({ key: known.key, href: known.href, visible: item.visible !== false });
  }
  return out.length ? out : fallback.map((item) => ({ ...item }));
}
