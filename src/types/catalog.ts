export interface Catalog {
  id: string;
  slug: string;
  title: string;
  year: number;
  description: string;
  cover?: string;
  pdfUrl?: string;
  pageCount?: number;
}
