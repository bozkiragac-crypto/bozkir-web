export interface Brand {
  id: string;
  name: string;
  logo: string;
  url?: string;
  category?: string;
  categoryEn?: string;
  categoryAr?: string;
  description?: string;
  /** Logo görselinin gerçek piksel ölçüsü (orantı için). */
  width?: number;
  height?: number;
}
