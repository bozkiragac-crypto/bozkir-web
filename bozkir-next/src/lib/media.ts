export const MAX_UPLOAD_MB = 5;
export const MAX_PDF_MB = 20;
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const ALLOWED_PDF_MIME = ['application/pdf'];

/**
 * DB `img` alanı çok biçimlidir: JSON dizi, virgüllü liste veya tek değer.
 * Her zaman string dizisi döndürür.
 */
export function parseImageField(raw?: string | null): string[] {
  if (!raw) return [];
  const t = raw.trim();
  if (!t) return [];
  if (t.startsWith('[')) {
    try {
      const arr = JSON.parse(t);
      return Array.isArray(arr) ? arr.map((v) => String(v).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  if (t.startsWith('data:')) return [t];
  return t
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Görsel listesini DB'ye yazılacak JSON metnine çevirir. */
export function serializeImageField(urls: string[]): string | null {
  const clean = urls.map((u) => u.trim()).filter(Boolean);
  if (!clean.length) return null;
  if (clean.length === 1) return clean[0] ?? null;
  return JSON.stringify(clean);
}

export function validateUpload(file: { size: number; type: string }): string | null {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `Dosya en fazla ${MAX_UPLOAD_MB} MB olabilir.`;
  if (!ALLOWED_MIME.includes(file.type)) return 'Yalnızca JPG, PNG, WebP veya AVIF yükleyebilirsiniz.';
  return null;
}
