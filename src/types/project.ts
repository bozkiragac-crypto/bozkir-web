export type ProjectCategory =
  | 'otel'
  | 'restoran'
  | 'ofis'
  | 'mobilya'
  | 'konut'
  | 'ticari'
  | 'ozel-proje';

export interface Project {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: ProjectCategory;
  year?: number;
  description: string;
  images: string[];
  products?: string[];
  featured?: boolean;
}
