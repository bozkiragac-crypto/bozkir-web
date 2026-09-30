export interface ContentItem {
  id: string;
  blockKey: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  tag: string;
  sortOrder: number;
  /** Çeviri alanları (opsiyonel); boşsa Türkçeye düşer. */
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  tagEn?: string;
  tagAr?: string;
}

export interface ContentBlock {
  key: string;
  title: string;
  subtitle: string;
  body: string;
  items: ContentItem[];
  /** Çeviri alanları (opsiyonel); boşsa Türkçeye düşer. */
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
}

export type ContentBlockKey = 'gallery' | 'guide' | 'applications' | 'process' | 'faq';
