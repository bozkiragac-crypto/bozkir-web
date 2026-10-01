export interface QuoteRequest {
  fullName: string;
  company?: string;
  phone: string;
  email: string;
  product?: string;
  productId?: string;
  productSlug?: string;
  quantity?: string;
  dimensions?: string;
  note?: string;
  /** KVKK/gizlilik onayı — sunucuda da zorunlu. */
  consent?: boolean;
  /** Yüklenen dosyanın meta bilgisi (gerçek yükleme backend'de yapılır). */
  attachment?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface QuoteResponse {
  ok: boolean;
  message: string;
  /** HTTP durum kodu (429/422 vb. ayrımı için). */
  status?: number;
}
