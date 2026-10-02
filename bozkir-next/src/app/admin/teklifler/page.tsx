import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import Link from 'next/link';
import { Mail, Phone, Building2, Package, Paperclip, Calendar, Search, Download } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { DeleteQuoteButton } from '@/components/admin/DeleteButtons';
import { QuoteItemTools, QuoteStatusBadge } from '@/components/admin/QuoteItemTools';
import { formatDateTime } from '@/lib/datetime';
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL, type QuoteStatus } from '@/lib/quotes/status';

export const dynamic = 'force-dynamic';

/** Tüm teklifler tek seferde render ediliyordu; talep sayısı arttıkça sayfa kilitleniyordu. */
const PAGE_SIZE = 20;

const STATUS_ORDER: QuoteStatus[] = [...QUOTE_STATUSES];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function fmt(date: Date | null): string {
  return formatDateTime(date, 'medium');
}

function buildQuery(params: { durum?: string; q?: string; sayfa?: number }): string {
  const qs = new URLSearchParams();
  if (params.durum) qs.set('durum', params.durum);
  if (params.q) qs.set('q', params.q);
  if (params.sayfa && params.sayfa > 1) qs.set('sayfa', String(params.sayfa));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function quoteFilters(status: string, q: string): SQL | undefined {
  const conds: SQL[] = [];
  if ((STATUS_ORDER as readonly string[]).includes(status)) {
    conds.push(eq(quoteRequests.status, status));
  }
  if (q) {
    const like = `%${q}%`;
    const search = or(
      ilike(quoteRequests.fullName, like),
      ilike(quoteRequests.company, like),
      ilike(quoteRequests.email, like),
      ilike(quoteRequests.phone, like),
      ilike(quoteRequests.product, like),
    );
    if (search) conds.push(search);
  }
  return conds.length ? and(...conds) : undefined;
}

export default async function QuoteRequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(str(sp.sayfa, '1'), 10) || 1);
  const status = str(sp.durum);
  const q = str(sp.q).trim();

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

  const where = quoteFilters(status, q);

  const [rows, [totalRow], statusRows] = await Promise.all([
    db
      .select()
      .from(quoteRequests)
      .where(where)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(quoteRequests).where(where),
    db
      .select({ status: quoteRequests.status, value: count() })
      .from(quoteRequests)
      .groupBy(quoteRequests.status),
  ]);

  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const counts = new Map<string, number>();
  let allCount = 0;
  for (const r of statusRows) {
    counts.set(r.status, Number(r.value));
    allCount += Number(r.value);
  }

  const exportQs = new URLSearchParams();
  if (status) exportQs.set('durum', status);
  if (q) exportQs.set('q', q);
  const exportHref = `/api/admin/quote-export${exportQs.toString() ? `?${exportQs}` : ''}`;

  const tabs: { key: string; label: string; value: number }[] = [
    { key: '', label: 'Tümü', value: allCount },
    ...STATUS_ORDER.map((s) => ({ key: s, label: QUOTE_STATUS_LABEL[s], value: counts.get(s) ?? 0 })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Teklifler</h1>
          <p className="mt-2 text-sm text-muted-strong">
            {total} adet teklif talebi. Durum takibi ve dahili notlar aşağıdadır.
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-strong transition-colors hover:border-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" /> CSV indir
        </a>
      </div>

      {/* Durum sekmeleri */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = status === t.key;
          const href = `/admin/teklifler${buildQuery({ durum: t.key, q })}`;
          return (
            <Link
              key={t.key || 'all'}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-strong hover:border-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              <span className="numerals opacity-70">{t.value}</span>
            </Link>
          );
        })}
      </div>

      {/* Arama */}
      <form action="/admin/teklifler" method="get" className="mt-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="durum" value={status} />}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ad, firma, telefon, e-posta veya ürün ara…"
            className="w-full rounded-md border border-border bg-surface py-2 pr-3 pl-9 text-sm text-fg"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-xs text-fg transition-colors hover:bg-surface-2"
        >
          Ara
        </button>
        {q && (
          <Link
            href={`/admin/teklifler${buildQuery({ durum: status })}`}
            className="inline-flex items-center rounded-md px-3 py-2 text-xs text-muted-strong transition-colors hover:text-foreground"
          >
            Temizle
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          {q || status ? 'Bu filtrelere uyan teklif talebi yok.' : 'Henüz teklif talebi yok.'}
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="flex flex-wrap items-center gap-2 text-lg font-medium tracking-tight">
                    {r.fullName}
                    {r.company ? <span className="text-muted-strong"> · {r.company}</span> : null}
                    <QuoteStatusBadge status={(r.status as QuoteStatus) ?? 'new'} />
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

              <QuoteItemTools
                id={r.id}
                status={(r.status as QuoteStatus) ?? 'new'}
                internalNote={r.internalNote}
                phone={r.phone}
                fullName={r.fullName}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Teklif sayfaları" className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/teklifler${buildQuery({ durum: status, q, sayfa: page - 1 })}`}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2"
            >
              Önceki
            </Link>
          )}
          <span className="numerals px-2 text-xs text-muted-strong">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/teklifler${buildQuery({ durum: status, q, sayfa: page + 1 })}`}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2"
            >
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
