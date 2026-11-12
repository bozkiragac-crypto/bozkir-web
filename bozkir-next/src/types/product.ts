export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  code?: string;
  category: string;
  categorySlug: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  thumbnail?: string;
  technicalSpecs?: ProductSpec[];
  /** Yüzey bilgisi (DB `face` alanı). */
  face?: string;
  colors?: string[];
  thicknesses?: string[];
  /** Plaka/ölçü bilgisi, ör. "2800 × 2100 mm". */
  dimensions?: string;
  applications?: string[];
  documents?: { title: string; url: string }[];
  brand?: string;
  featured?: boolean;
  sortOrder?: number;
  /** Son güncelleme (ISO); sitemap `lastModified` için. */
  updatedAt?: string;
  /** Admin'den düzenlenebilir SEO başlığı/açıklaması (boşsa otomatik üretilir). */
  seoTitle?: string;
  seoDescription?: string;
  /** Ürün bazlı WhatsApp mesajı (locale'e göre çözülür; boşsa genel şablon). */
  whatsappMessage?: string;
}

export interface ProductFilters {
  category?: string;
  color?: string;
  thickness?: string;
  surface?: string;
  brand?: string;
  size?: string;
  application?: string;
  query?: string;
  /** Sıralama: varsayılan en yeni. */
  sort?: ProductSort;
  limit?: number;
  offset?: number;
}

export type ProductSort = 'newest' | 'name-asc' | 'name-desc' | 'code-asc';

export interface ProductQueryResult {
  items: Product[];
  total: number;
}

/** Filtre panelinde gösterilen mevcut değerler. Boş dizi → filtre gizlenir. */
export interface ProductFacets {
  surfaces: string[];
  thicknesses: string[];
  colors: string[];
}
