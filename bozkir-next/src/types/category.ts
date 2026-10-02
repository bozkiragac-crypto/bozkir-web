export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Çeviri adları; verilmezse `name` kullanılır. */
  nameEn?: string;
  nameAr?: string;
  description: string;
  descriptionEn?: string;
  descriptionAr?: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  shortDescriptionAr?: string;
  heroImage?: string;
  thumbnail?: string;
  featured?: boolean;
  sortOrder?: number;
  /** Panelden pasifleştirilen kategori vitrinde listelenmez. */
  isActive?: boolean;
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
