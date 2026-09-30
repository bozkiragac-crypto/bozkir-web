export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  sortOrder: number;
  /** Çeviri alanları (opsiyonel); boşsa Türkçeye düşer. */
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  linkLabelEn?: string;
  linkLabelAr?: string;
}
