export interface QuoteRequest {
  fullName: string;
  company?: string;
  phone: string;
  email: string;
  product?: string;
  quantity?: string;
  dimensions?: string;
  note?: string;
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
}
