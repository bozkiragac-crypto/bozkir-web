import type { Locale } from '@/i18n/config';

/**
 * Renk / ahşap / dekor adları sözlüğü.
 *
 * Kurallar:
 * - Yalnızca tüm kelimeler sözlükte eşleşiyorsa çeviri yapılır. Böylece
 *   "Hezaren", "Zenith", "Royal Mermer" gibi marka/seri adları olduğu gibi kalır.
 * - Çeviri yalnızca görüntü içindir. Filtre ve URL değerleri her zaman kanonik
 *   Türkçe değeri kullanır (paylaşılabilirlik korunur).
 * - Ürün adı bir renk/ahşap adıysa `colors` alanı bu adla doldurulur; böylece
 *   renk facet'i boş kalmaz. Veri tabanına yazılmaz, runtime'da türetilir.
 */

interface DecorName {
  en: string;
  ar: string;
}

const DECOR_NAMES: Record<string, DecorName> = {
  // Temel renkler
  mavi: { en: 'Blue', ar: 'أزرق' },
  beyaz: { en: 'White', ar: 'أبيض' },
  siyah: { en: 'Black', ar: 'أسود' },
  kırmızı: { en: 'Red', ar: 'أحمر' },
  sarı: { en: 'Yellow', ar: 'أصفر' },
  yeşil: { en: 'Green', ar: 'أخضر' },
  gri: { en: 'Grey', ar: 'رمادي' },
  bej: { en: 'Beige', ar: 'بيج' },
  krem: { en: 'Cream', ar: 'كريمي' },
  antrasit: { en: 'Anthracite', ar: 'أنثراسيت' },
  vizon: { en: 'Taupe', ar: 'بني فاتح' },
  mürdüm: { en: 'Plum', ar: 'برقوقي' },
  koton: { en: 'Cotton', ar: 'قطني' },

  // Metalik / parlak yüzeyler
  altın: { en: 'Gold', ar: 'ذهبي' },
  gümüş: { en: 'Silver', ar: 'فضي' },
  inci: { en: 'Pearl', ar: 'لؤلؤي' },
  sedef: { en: 'Mother-of-pearl', ar: 'صدفي' },
  metalik: { en: 'Metallic', ar: 'معدني' },
  krom: { en: 'Chrome', ar: 'كروم' },
  ayna: { en: 'Mirror', ar: 'مرآة' },
  'ayna krom': { en: 'Mirror (Chrome)', ar: 'مرآة (كروم)' },

  // Kahve / sıcak tonlar
  bitter: { en: 'Bitter', ar: 'مر' },
  latte: { en: 'Latte', ar: 'لاتيه' },
  cappuccino: { en: 'Cappuccino', ar: 'كابتشينو' },
  moka: { en: 'Mocha', ar: 'موكا' },
  kahve: { en: 'Coffee', ar: 'قهوي' },
  kehribar: { en: 'Amber', ar: 'كهرماني' },
  amber: { en: 'Amber', ar: 'كهرماني' },
  safir: { en: 'Sapphire', ar: 'ياقوتي' },
  sahra: { en: 'Sahara', ar: 'صحراوي' },
  kum: { en: 'Sand', ar: 'رملي' },
  taş: { en: 'Stone', ar: 'حجري' },
  toprak: { en: 'Earth', ar: 'ترابي' },

  // Açık / koyu / yüzey niteleyicileri
  açık: { en: 'Light', ar: 'فاتح' },
  koyu: { en: 'Dark', ar: 'داكن' },
  derin: { en: 'Deep', ar: 'عميق' },
  doğal: { en: 'Natural', ar: 'طبيعي' },
  yeni: { en: 'New', ar: 'جديد' },
  antik: { en: 'Antique', ar: 'عتيق' },
  rustik: { en: 'Rustic', ar: 'ريفي' },
  retro: { en: 'Retro', ar: 'رجعي' },
  mistik: { en: 'Mystic', ar: 'غامض' },
  çizgili: { en: 'Striped', ar: 'مخطط' },
  sis: { en: 'Fog', ar: 'ضبابي' },
  kül: { en: 'Ash', ar: 'فحمي' },
  kar: { en: 'Snow', ar: 'ثلجي' },
  ay: { en: 'Moon', ar: 'قمري' },
  dolunay: { en: 'Full moon', ar: 'بدر' },
  su: { en: 'Water', ar: 'مائي' },
  çim: { en: 'Grass', ar: 'عشبي' },
  ıhlamur: { en: 'Linden', ar: 'زيزفون' },

  // Doğal taş / mermer görünümleri
  traverten: { en: 'Travertine', ar: 'ترافرتين' },
  mermer: { en: 'Marble', ar: 'رخامي' },
  selenit: { en: 'Selenite', ar: 'سيلينيت' },
  kaşmir: { en: 'Cashmere', ar: 'كشمير' },
  lava: { en: 'Lava', ar: 'حمم' },

  // Ahşap türleri ve kaplamalar
  teak: { en: 'Teak', ar: 'تيك' },
  bambu: { en: 'Bamboo', ar: 'خيزران' },
  huş: { en: 'Birch', ar: 'بتولا' },
  kayın: { en: 'Beech', ar: 'زان' },
  ceviz: { en: 'Walnut', ar: 'جوز' },
  meşe: { en: 'Oak', ar: 'بلوط' },
  çam: { en: 'Pine', ar: 'صنوبر' },
  'akça ağaç': { en: 'Maple', ar: 'قيقب' },
  akçağaç: { en: 'Maple', ar: 'قيقب' },
  zebrano: { en: 'Zebrano', ar: 'زيبرانو' },
  palisender: { en: 'Rosewood', ar: 'خشب الورد' },
  söğüt: { en: 'Willow', ar: 'صفصاف' },
  vişne: { en: 'Cherry', ar: 'كرزي' },

  // Bileşik dekor adları (daha doğal çeviri için tam eşleşme)
  'kum beji': { en: 'Sand Beige', ar: 'بيج رملي' },
  'kum taşı': { en: 'Sandstone', ar: 'حجر رملي' },
  'gri taş': { en: 'Grey Stone', ar: 'حجر رمادي' },
  'siyah taş': { en: 'Black Stone', ar: 'حجر أسود' },
  'sis gri': { en: 'Fog Grey', ar: 'رمادي ضبابي' },
  'kül gri': { en: 'Ash Grey', ar: 'رمادي فحمي' },
  'koyu gri': { en: 'Dark Grey', ar: 'رمادي داكن' },
  'kar beyaz': { en: 'Snow White', ar: 'أبيض ثلجي' },
  'derin beyaz': { en: 'Deep White', ar: 'أبيض عميق' },
  'derin siyah': { en: 'Deep Black', ar: 'أسود عميق' },
  'koton bej': { en: 'Cotton Beige', ar: 'بيج قطني' },
  'koton gri': { en: 'Cotton Grey', ar: 'رمادي قطني' },
  'koton vizon': { en: 'Cotton Taupe', ar: 'بني قطني' },
  'vizon latte': { en: 'Taupe Latte', ar: 'لاتيه بني' },
  'moka kahve': { en: 'Mocha Coffee', ar: 'قهوة موكا' },
  'metalik antrasit': { en: 'Metallic Anthracite', ar: 'أنثراسيت معدني' },
  'metalik gri': { en: 'Metallic Grey', ar: 'رمادي معدني' },
  'metalik inci': { en: 'Metallic Pearl', ar: 'لؤلؤي معدني' },
  'metalik bitter': { en: 'Metallic Bitter', ar: 'مر معدني' },
  'retro gümüş': { en: 'Retro Silver', ar: 'فضي رجعي' },
  'antik dark': { en: 'Antique Dark', ar: 'داكن عتيق' },
  'antik light': { en: 'Antique Light', ar: 'فاتح عتيق' },
  'çizgili beyaz': { en: 'Striped White', ar: 'أبيض مخطط' },
  'sedef krem': { en: 'Pearl Cream', ar: 'كريمي صدفي' },
  'sedef krem ay taşı': { en: 'Pearl Cream · Moonstone', ar: 'كريمي صدفي · حجر القمر' },
  'ay taşı': { en: 'Moonstone', ar: 'حجر القمر' },
  'su yeşili': { en: 'Water Green', ar: 'أخضر مائي' },
  'çim yeşil': { en: 'Grass Green', ar: 'أخضر عشبي' },
  'ıhlamur yeşili': { en: 'Linden Green', ar: 'أخضر زيزفون' },
  'mistik mürdüm': { en: 'Mystic Plum', ar: 'برقوقي غامض' },
  'vişne mermer': { en: 'Cherry Marble', ar: 'رخام كرزي' },
  'antrasit meşe': { en: 'Anthracite Oak', ar: 'بلوط أنثراسيت' },
  'safir meşe': { en: 'Sapphire Oak', ar: 'بلوط ياقوتي' },
  'rustik meşe': { en: 'Rustic Oak', ar: 'بلوط ريفي' },
  'yeni meşe': { en: 'New Oak', ar: 'بلوط جديد' },
  'beyaz huş': { en: 'White Birch', ar: 'بتولا بيضاء' },
  'doğal huş': { en: 'Natural Birch', ar: 'بتولا طبيعية' },
  'açık zebrano': { en: 'Light Zebrano', ar: 'زيبرانو فاتح' },
  'amber ceviz': { en: 'Amber Walnut', ar: 'جوز كهرماني' },
  'sahra meşe': { en: 'Sahara Oak', ar: 'بلوط صحراوي' },
};

/**
 * Sözlük araması için normal biçim: küçük harf, parantez/noktalama ve tire
 * kaldırılır, boşluklar tekilleştirilir. "Sedef Krem - Ay Taşı" →
 * "sedef krem ay taşı".
 */
export function decorKey(value: string): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr')
    .replace(/[()[\],.;:]/g, ' ')
    .replace(/[-–—/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decorTokens(value: string): string[] {
  return decorKey(value).split(' ').filter(Boolean);
}

/** Değer, tamamen renk/ahşap/dekor kelimelerinden mi oluşuyor? */
export function isDecorName(value?: string | null): boolean {
  const text = String(value ?? '').trim();
  if (!text) return false;
  if (DECOR_NAMES[decorKey(text)]) return true;
  const tokens = decorTokens(text);
  return tokens.length > 0 && tokens.every((token) => Boolean(DECOR_NAMES[token]));
}

/**
 * Renk/ahşap adını görüntü için çevirir.
 * Tüm kelimeler sözlükte eşleşmiyorsa (marka/seri adı) metin olduğu gibi döner.
 */
export function translateDecorName(value: string, locale?: Locale): string {
  const text = String(value ?? '').trim();
  if (!text || !locale || locale === 'tr') return text;

  const exact = DECOR_NAMES[decorKey(text)];
  if (exact) return exact[locale];

  const tokens = decorTokens(text);
  if (tokens.length === 0) return text;
  const parts: string[] = [];
  for (const token of tokens) {
    const entry = DECOR_NAMES[token];
    if (!entry) return text;
    parts.push(entry[locale]);
  }
  return parts.join(' ');
}

/** Filtre etiketi için renk değerini çevirir; değer/URL kanonik TR kalır. */
export function localizeColor(value: string, locale?: Locale): string {
  return translateDecorName(value, locale);
}

/**
 * Ürünün renk listesini döndürür.
 * Admin'den girilmiş renkler varsa onlar korunur; boşsa ve ürün adı bir
 * renk/ahşap adıysa ad kanonik değer olarak kullanılır.
 */
export function deriveColors(stored: string[], name?: string | null): string[] {
  const values = (stored ?? []).map((value) => String(value ?? '').trim()).filter(Boolean);
  if (values.length > 0) return values;
  const text = String(name ?? '').trim();
  return text && isDecorName(text) ? [text] : [];
}
