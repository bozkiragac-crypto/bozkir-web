'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowUp, ArrowDown } from 'lucide-react';
import { saveSiteSettings } from '@/lib/admin/safe-actions';
import type { SiteSettings } from '@/lib/data/settings';

const field = 'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-foreground';

export function SettingsForm({
  initial,
  categories,
  campaigns = [],
}: {
  initial: SiteSettings;
  categories: { slug: string; name: string }[];
  campaigns?: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const order = form.featuredOrder.length ? form.featuredOrder : categories.map((c) => c.slug);
  const nameOf = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  function setOrder(next: string[]) {
    setForm({ ...form, featuredOrder: next });
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setOrder(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await saveSiteSettings({ ...form, featuredOrder: order });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: 'Ayarlar kaydedildi.' } : { ok: false, text: res.error ?? 'Kaydedilemedi.' });
    if (res.ok) router.refresh();
  }

  const section = 'rounded-xl border border-border bg-surface p-6';

  return (
    <form onSubmit={onSubmit}>
      <h1 className="text-2xl font-medium tracking-tight">Site ayarları</h1>
      <p className="mt-1 text-sm text-muted-strong">İletişim bilgileri ve vitrin kategori sırası.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className={section}>
          <p className="font-medium">İletişim</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Telefon *">
              <input className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Label>
            <Label t="Telefon 2 (depo)">
              <input className={field} value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} />
            </Label>
            <Label t="WhatsApp linki">
              <input className={field} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </Label>
            <Label t="E-posta">
              <input className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Label>
            <Label t="Çalışma saatleri (TR)" full>
              <input className={field} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </Label>
            <Label t="Çalışma saatleri (EN)" full>
              <input className={field} value={form.hoursEn} onChange={(e) => setForm({ ...form, hoursEn: e.target.value })} />
            </Label>
            <Label t="Çalışma saatleri (AR)" full>
              <input className={field} dir="rtl" value={form.hoursAr} onChange={(e) => setForm({ ...form, hoursAr: e.target.value })} />
            </Label>
          </div>
        </div>

        <div className={section}>
          <p className="font-medium">Adres & Sosyal</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Adres satırı" full>
              <input className={field} value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
            </Label>
            <Label t="İlçe">
              <input className={field} value={form.address.locality} onChange={(e) => setForm({ ...form, address: { ...form.address, locality: e.target.value } })} />
            </Label>
            <Label t="İl">
              <input className={field} value={form.address.region} onChange={(e) => setForm({ ...form, address: { ...form.address, region: e.target.value } })} />
            </Label>
            <Label t="Posta kodu">
              <input className={field} value={form.address.postalCode} onChange={(e) => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })} />
            </Label>
            <Label t="Instagram">
              <input className={field} value={form.social.instagram} onChange={(e) => setForm({ ...form, social: { ...form.social, instagram: e.target.value } })} />
            </Label>
            <Label t="Facebook" full>
              <input className={field} value={form.social.facebook} onChange={(e) => setForm({ ...form, social: { ...form.social, facebook: e.target.value } })} />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2`}>
          <p className="font-medium">Depo konumu</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Depo adresi (opsiyonel)" full>
              <input className={field} value={form.warehouse.address} onChange={(e) => setForm({ ...form, warehouse: { ...form.warehouse, address: e.target.value } })} />
            </Label>
            <Label t="Koordinatlar (enlem,boylam)" full>
              <input className={field} value={form.warehouse.coords} onChange={(e) => setForm({ ...form, warehouse: { ...form.warehouse, coords: e.target.value } })} placeholder="36.238639,36.176806" />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2`}>
          <p className="font-medium">Kampanya popup</p>
          <p className="mt-1 text-sm text-muted-strong">Siteye girişte bir kez gösterilen kampanya modalı (günde 1 kez).</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex h-11 items-center gap-3 rounded-md border border-border bg-surface px-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.popupEnabled}
                onChange={(e) => setForm({ ...form, popupEnabled: e.target.checked })}
              />
              <span className="text-sm">Popup&apos;ı etkinleştir</span>
            </label>
            <Label t="Gösterilecek kampanya" full>
              <select
                className={field}
                value={form.popupCampaignId}
                onChange={(e) => setForm({ ...form, popupCampaignId: e.target.value })}
              >
                <option value="">İlk aktif kampanya</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2`}>
          <p className="font-medium">Webhook</p>
          <p className="mt-1 text-sm text-muted-strong">
            Tanımlanırsa olaylarda (ör. yeni teklif) JSON POST atılır. Slack/CRM/e-posta entegrasyonları bu URL üzerinden yapılabilir.
          </p>
          <div className="mt-5">
            <Label t="Webhook URL" full>
              <input
                className={field}
                value={form.webhookUrl}
                onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                placeholder="https://hooks.example.com/..."
              />
            </Label>
          </div>
        </div>
      </div>

      <div className={`${section} mt-6`}>
        <p className="font-medium">Vitrin kategori sırası</p>
        <p className="mt-1 text-sm text-muted-strong">Anasayfadaki &quot;Malzeme koleksiyonu&quot; ve &quot;Malzemeyi Keşfet&quot; bölümlerinin sırası.</p>
        <ul className="mt-5 divide-y divide-border">
          {order.map((slug, i) => (
            <li key={slug} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>
                <span className="numerals mr-3 text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                {nameOf(slug)}
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı" className="rounded-md border border-border p-1.5 disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Aşağı" className="rounded-md border border-border p-1.5 disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setOrder(categories.map((c) => c.slug))} className="mt-3 text-xs text-muted underline">
          Varsayılan sıraya dön
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {msg && <p className={msg.ok ? 'text-sm text-green-700' : 'text-sm text-red-600'}>{msg.text}</p>}
      </div>
    </form>
  );
}

function Label({ t, full, children }: { t: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`grid gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-[0.14em] text-muted">{t}</span>
      {children}
    </label>
  );
}
