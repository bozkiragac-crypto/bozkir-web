/**
 * Admin/kullanıcı tarafından girilen bağlantıları güvenli hâle getirir.
 *
 * Yalnızca:
 *  - `http:` / `https:` mutlak URL'ler
 *  - site-içi göreli yollar (`/yol`, `?sorgu`, `#çapa`)
 * kabul edilir. `javascript:`, `data:`, `vbscript:`, protokol-göreli (`//host`),
 * kontrol karakterleri ve ters eğik çizgi içeren değerler boş döner. Böylece
 * kaydetme (server action) ve render (bileşen) tarafında stored XSS / open
 * redirect engellenir.
 */
export function safeHref(value: string | null | undefined): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  // Kontrol karakterleri (CR/LF/null vb.) reddedilir.
  if (/[\u0000-\u001f\u007f]/.test(v)) return '';
  // Protokol-göreli (`//evil.com`) ve ters eğik çizgi (`/\evil.com`) reddedilir.
  if (v.startsWith('//') || v.includes('\\')) return '';
  // Site-içi göreli yol / sorgu / çapa.
  if (/^[/?#]/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol === 'http:' || u.protocol === 'https:') return v;
  } catch {
    // Mutlak URL değil ve göreli de değil — reddet.
  }
  return '';
}
