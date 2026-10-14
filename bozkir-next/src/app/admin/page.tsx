import Link from 'next/link';
import { count, desc, gte, eq, sql } from 'drizzle-orm';
import {
  Package,
  Megaphone,
  FileText,
  Inbox,
  Users,
  Images,
  Settings,
  History,
  ArrowUpRight,
  Plus,
  HardDrive,
} from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { activityLog, adminUsers, campaigns, contentItems, products, quoteRequests } from '@/lib/db/schema';
import { APP_TIME_ZONE, formatDateTime, formatDayKey, startOfLocalDay } from '@/lib/datetime';
import { getBackupStatus } from '@/lib/backup-status';

export const dynamic = 'force-dynamic';

function fmt(date: Date | null): string {
  return formatDateTime(date);
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const w = 280;
  const h = 60;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${Math.round(i * step)},${Math.round(h - (v / max) * (h - 8) - 4)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full text-accent" preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default async function AdminDashboardPage() {
  const db = getDb();
  if (!db) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Panel</h1>
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <strong className="font-medium">VeritabanÄ± baÄŸlantÄ±sÄ± yok.</strong>
        </div>
      </div>
    );
  }

  // Grafik 14 gÃ¼nlÃ¼k; baÅŸlangÄ±Ã§ uygulama saat diliminin gÃ¼n baÅŸÄ±nda olsun ki
  // "bugÃ¼n" Ã§ubuÄŸu UTC gÃ¼nÃ¼yle kaymasÄ±n.
  const backup = getBackupStatus();
  const since = startOfLocalDay(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));

  const [
    [productRow],
    [activeProductRow],
    [campaignRow],
    [contentRow],
    [quoteRow],
    [weekQuoteRow],
    [newQuoteRow],
    [userRow],
    recentQuotes,
    recentActivity,
    daily,
  ] = await Promise.all([
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ value: count() }).from(campaigns),
    db.select({ value: count() }).from(contentItems),
    db.select({ value: count() }).from(quoteRequests),
    db.select({ value: count() }).from(quoteRequests).where(gte(quoteRequests.createdAt, new Date(Date.now() - 7 * 864e5))),
    db.select({ value: count() }).from(quoteRequests).where(eq(quoteRequests.status, 'new')),
    db.select({ value: count() }).from(adminUsers),
    db.select({ id: quoteRequests.id, fullName: quoteRequests.fullName, phone: quoteRequests.phone, createdAt: quoteRequests.createdAt }).from(quoteRequests).orderBy(desc(quoteRequests.createdAt)).limit(5),
    db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(6),
    db
      .select({ day: sql<string>`to_char(created_at AT TIME ZONE ${sql.raw(`'${APP_TIME_ZONE}'`)}, 'YYYY-MM-DD')`, n: count() })
      .from(quoteRequests)
      .where(gte(quoteRequests.createdAt, since))
      .groupBy(sql`to_char(created_at AT TIME ZONE ${sql.raw(`'${APP_TIME_ZONE}'`)}, 'YYYY-MM-DD')`),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, Number(d.n)]));
  const series: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = formatDayKey(new Date(Date.now() - i * 864e5));
    series.push(byDay.get(key) ?? 0);
  }
  const weekTotal = series.slice(-7).reduce((a, b) => a + b, 0);

  const cards: {
    href: string;
    icon: typeof Package;
    label: string;
    value: number;
    hint: string;
    badge?: number;
  }[] = [
    { href: '/admin/urunler', icon: Package, label: 'ÃœrÃ¼nler', value: productRow?.value ?? 0, hint: `${activeProductRow?.value ?? 0} aktif` },
    { href: '/admin/kampanyalar', icon: Megaphone, label: 'Kampanyalar', value: campaignRow?.value ?? 0, hint: 'Vitrin kampanyalarÄ±' },
    { href: '/admin/icerik', icon: FileText, label: 'Ä°Ã§erik Ã¶ÄŸeleri', value: contentRow?.value ?? 0, hint: 'Galeri, rehber, SSS' },
    { href: '/admin/teklifler', icon: Inbox, label: 'Teklifler', value: quoteRow?.value ?? 0, hint: `Son 7 gÃ¼n: ${weekQuoteRow?.value ?? 0}`, badge: newQuoteRow?.value ?? 0 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Panel</h1>
          <p className="mt-1 text-sm text-muted-strong">Site iÃ§eriÄŸini ve talepleri buradan yÃ¶netin.</p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Yeni ÃœrÃ¼n
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:bg-surface-2">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-accent" />
                <span className="flex items-center gap-2">
                  {card.badge ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-medium text-background">
                      {card.badge} yeni
                    </span>
                  ) : null}
                  <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
              <p className="numerals mt-6 text-4xl font-medium tracking-tight">{card.value}</p>
              <p className="mt-2 font-medium">{card.label}</p>
              <p className="mt-1 text-sm text-muted-strong">{card.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <p className="font-medium">Teklif talepleri Â· son 14 gÃ¼n</p>
            <p className="numerals text-sm text-muted">7 gÃ¼n: {weekTotal}</p>
          </div>
          <Sparkline data={series} />
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-strong sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Toplam</p>
              <p className="numerals mt-1 text-lg text-foreground">{quoteRow?.value ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Bu hafta</p>
              <p className="numerals mt-1 text-lg text-foreground">{weekQuoteRow?.value ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">KullanÄ±cÄ±</p>
              <p className="numerals mt-1 text-lg text-foreground">{userRow?.value ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Aktif Ã¼rÃ¼n</p>
              <p className="numerals mt-1 text-lg text-foreground">{activeProductRow?.value ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="font-medium">Son teklifler</p>
          {recentQuotes.length === 0 ? (
            <p className="mt-4 text-sm text-muted">HenÃ¼z talep yok.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recentQuotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{q.fullName}</p>
                    <p className="numerals text-xs text-muted">{q.phone}</p>
                  </div>
                  <span className="flex-none text-xs text-muted">{fmt(q.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/teklifler" className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
            TÃ¼mÃ¼nÃ¼ gÃ¶r <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {[
            { href: '/admin/medya', label: 'Medya kÃ¼tÃ¼phanesi', icon: Images },
            { href: '/admin/kullanicilar', label: 'KullanÄ±cÄ±lar', icon: Users },
            { href: '/admin/ayarlar', label: 'Site ayarlarÄ±', icon: Settings },
            { href: '/admin/aktivite', label: 'Aktivite kaydÄ±', icon: History },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.href} href={q.href} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-2">
                <Icon className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">{q.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="font-medium">Son aktiviteler</p>
          {recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-muted">KayÄ±t yok.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{a.summary ?? `${a.action} Â· ${a.entity ?? ''}`}</p>
                    <p className="text-xs text-muted">{a.username}</p>
                  </div>
                  <span className="flex-none text-xs text-muted">{fmt(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/aktivite" className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
            TÃ¼m kayÄ±tlar <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Yedekleme durumu</p>
              <p className="mt-1 text-sm text-muted-strong">
                {backup.available
                  ? `Son yedek: ${backup.createdAt} Â· ${backup.fileCount} dosya Â· ${formatBytes(backup.totalBytes ?? 0)}`
                  : 'Yedek bilgisi bulunamadÄ±. Sunucuda scripts/backup.sh Ã§alÄ±ÅŸtÄ±rÄ±n.'}
              </p>
            </div>
          </div>
          {backup.available && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-success">HazÄ±r</span>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          GÃ¼venlik gereÄŸi panelden yedek tetiklenmez; yalnÄ±zca son durum gÃ¶sterilir.
        </p>
      </div>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n > 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}
