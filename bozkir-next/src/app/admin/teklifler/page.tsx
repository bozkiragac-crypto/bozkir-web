import { desc } from 'drizzle-orm';
import { Mail, Phone, Building2, Package, Paperclip, Calendar } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { DeleteQuoteButton } from '@/components/admin/DeleteButtons';

export const dynamic = 'force-dynamic';

function fmt(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function QuoteRequestsPage() {
  const db = getDb();
  if (!db) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Teklifler</h1>
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <strong className="font-medium">Veritabanı bağlantısı yok.</strong>
        </div>
      </div>
    );
  }

  const rows = await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Teklifler</h1>
      <p className="mt-2 text-sm text-muted-strong">
        {rows.length} adet teklif talebi. Site içi formdan gelen talepler burada listelenir.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          Henüz teklif talebi yok.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-medium tracking-tight">
                    {r.fullName}
                    {r.company ? <span className="text-muted-strong"> · {r.company}</span> : null}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-strong">
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${r.phone}`} className="hover:text-foreground">{r.phone}</a>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${r.email}`} className="hover:text-foreground">{r.email}</a>
                    </span>
                    {r.company && (
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        {r.company}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmt(r.createdAt)}
                    </span>
                  </div>
                </div>
                <DeleteQuoteButton id={r.id} />
              </div>

              <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-border pt-5 text-sm sm:grid-cols-3">
                {r.product && (
                  <div>
                    <dt className="text-xs tracking-[0.14em] text-muted uppercase">Ürün / Model</dt>
                    <dd className="mt-1 flex flex-col items-start gap-2">
                      <span className="inline-flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 flex-none text-muted" />
                        {r.product}
                      </span>
                      {r.product}
                      {r.productSlug ? (
                        <span className="mt-1 flex flex-wrap gap-2">
                          {r.productSlug
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((slug) => (
                              <a
                                key={slug}
                                href={`/urunler/${slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-border px-2 py-0.5 text-xs underline underline-offset-2 hover:border-foreground"
                              >
                                {slug}
                              </a>
                            ))}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                )}
                {r.quantity && (
                  <div>
                    <dt className="text-xs tracking-[0.14em] text-muted uppercase">Adet</dt>
                    <dd className="mt-1 numerals">{r.quantity}</dd>
                  </div>
                )}
                {r.dimensions && (
                  <div>
                    <dt className="text-xs tracking-[0.14em] text-muted uppercase">Ölçü</dt>
                    <dd className="mt-1 numerals">{r.dimensions}</dd>
                  </div>
                )}
              </dl>

              {r.note && (
                <div className="mt-4 rounded-md bg-surface-2 p-4 text-sm leading-relaxed text-muted-strong">
                  {r.note}
                </div>
              )}

              {r.attachmentName &&
                (r.attachmentKey ? (
                  <a
                    href={`/api/quote-attachment?id=${r.id}`}
                    className="mt-4 inline-flex items-center gap-2 text-xs text-muted-strong underline underline-offset-4 hover:text-foreground"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Ek dosya: {r.attachmentName}
                  </a>
                ) : (
                  <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted">
                    <Paperclip className="h-3.5 w-3.5" />
                    Ek dosya (yüklenmedi): {r.attachmentName}
                  </p>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
