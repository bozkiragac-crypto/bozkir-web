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
  dimensions?: string[];
  applications?: string[];
  documents?: { title: string; url: string }[];
  brand?: string;
  featured?: boolean;
  sortOrder?: number;
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
  limit?: number;
  offset?: number;
}

export interface ProductQueryResult {
  items: Product[];
  total: number;
}
