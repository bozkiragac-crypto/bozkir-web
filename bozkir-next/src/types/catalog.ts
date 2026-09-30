export interface Catalog {
  id: string;
  slug: string;
  title: string;
  year: number;
  description: string;
  cover?: string;
  pdfUrl?: string;
  pageCount?: number;
  /** Çeviri alanları (opsiyonel); boşsa Türkçeye düşer. */
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}
