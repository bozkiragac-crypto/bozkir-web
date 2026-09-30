/** Yüklenen dosyanın gerçek türünü ilk baytlardan (magic bytes) doğrular. */

type Kind = 'pdf' | 'jpg' | 'png' | 'webp' | 'dwg' | 'unknown';

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (bytes[offset + i] !== sig[i]) return false;
  return true;
}

/** İlk N baytı okuyup dosya türünü belirler. */
export function sniffKind(head: Uint8Array): Kind {
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47])) return 'png';
  // WebP: "RIFF"...."WEBP"
  if (startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  // DWG: "AC10" (AutoCAD)
  if (startsWith(head, [0x41, 0x43, 0x31, 0x30])) return 'dwg';
  return 'unknown';
}

const ALLOWED: Kind[] = ['pdf', 'jpg', 'png', 'webp', 'dwg'];

/** Teklif eki için izinli tür mü? (uzantıdan bağımsız, içerikten) */
export function isAllowedAttachment(head: Uint8Array): boolean {
  return ALLOWED.includes(sniffKind(head));
}
