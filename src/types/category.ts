export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  heroImage?: string;
  thumbnail?: string;
  featured?: boolean;
  sortOrder?: number;
  /** API'den gelen ürün sayısı (varsa). */
  productCount?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryStoryStep {
  id: string;
  label: string;
  title: string;
  description: string;
  /** Teknik özet — gerçek veriyle doldurulur, uydurulmaz. */
  specs?: { label: string; value: string }[];
}
