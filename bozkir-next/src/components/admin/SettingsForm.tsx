'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowUp, ArrowDown, X } from 'lucide-react';
import { saveSiteSettings } from '@/lib/admin/safe-actions';
import { useToast } from '@/components/ui/ToastProvider';
import { ImageManager } from '@/components/admin/ImageManager';
import { Select } from '@/components/ui/Select';
import { Dropdown } from '@/components/ui/Dropdown';
import { normalizeWeeklyHours } from '@/lib/open-hours';
import type { NavSettingItem, SiteSettings } from '@/lib/data/settings';

/** 0=Pazar … 6=Cumartesi (JS getDay ile uyumlu). */
const DAY_LABELS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const field =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-foreground';

export function SettingsForm({
  initial,
  categories,
  campaigns = [],
  smtpPassSet = false,
  navLabels = {},
}: {
  initial: SiteSettings;
  categories: { slug: string; name: string }[];
  campaigns?: { id: string; title: string }[];
  smtpPassSet?: boolean;
  navLabels?: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState('general');
  const toast = useToast();

  // Kayıtlı sırayı mevcut kategorilerle uzlaştır: artık var olmayan (ürünleri/
  // kaydı silinmiş) slug'lar listeden düşer. Hiç sıra kaydedilmemişse tüm
  // kategoriler gösterilir. Kullanıcı listeden kategori çıkarabilir (×).
  const order = useMemo(() => {
    const all = categories.map((c) => c.slug);
    if (form.featuredOrder.length === 0) return all;
    return form.featuredOrder.filter((s) => all.includes(s));
  }, [form.featuredOrder, categories]);
  const unused = useMemo(
    () => categories.filter((c) => !order.includes(c.slug)),
    [categories, order],
  );
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

  function setOpenHoursDay(idx: number, value: { open: string; close: string } | null) {
    const next = normalizeWeeklyHours(form.openHours);
    next[idx] = value;
    setForm({ ...form, openHours: next });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await saveSiteSettings({ ...form, featuredOrder: order });
    setBusy(false);
    setMsg(
      res.ok
        ? { ok: true, text: 'Ayarlar kaydedildi.' }
        : { ok: false, text: res.error ?? 'Kaydedilemedi.' },
    );
    toast(res.ok ? 'Ayarlar kaydedildi.' : (res.error ?? 'Kaydedilemedi.'));
    if (res.ok) router.refresh();
  }

  const section = 'rounded-xl border border-border bg-surface p-6';
  const tabs = [
    { id: 'general', label: 'Genel' },
    { id: 'contact', label: 'İletişim' },
    { id: 'content', label: 'İçerik & SEO' },
    { id: 'email', label: 'E-posta' },
    { id: 'legal', label: 'Yasal' },
  ];
  const hide = (id: string) => (tab === id ? '' : 'hidden');

  return (
    <form onSubmit={onSubmit}>
      <h1 className="text-2xl font-medium tracking-tight">Site ayarları</h1>
      <p className="mt-1 text-sm text-muted-strong">
        İletişim bilgileri ve vitrin kategori sırası.
      </p>

      <div
        role="tablist"
        aria-label="Site ayarları bölümleri"
        className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? 'rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background'
                : 'rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-strong hover:bg-surface-2'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={`${section} mt-8 ${hide('general')}`}>
        <p className="font-medium">Site kimliği</p>
        <p className="mt-1 text-sm text-muted-strong">
          Başlık, footer ve yönetim panelinde görünen marka bilgileri. Boş bırakılan alan varsayılana
          döner.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Label t="Marka adı">
            <input
              className={field}
              value={form.identity.brandName}
              onChange={(e) =>
                setForm({ ...form, identity: { ...form.identity, brandName: e.target.value } })
              }
            />
          </Label>
          <Label t="Ticari / yasal ad">
            <input
              className={field}
              value={form.identity.legalName}
              onChange={(e) =>
                setForm({ ...form, identity: { ...form.identity, legalName: e.target.value } })
              }
            />
          </Label>
          <Label t="Slogan" full>
            <input
              className={field}
              value={form.identity.tagline}
              onChange={(e) =>
                setForm({ ...form, identity: { ...form.identity, tagline: e.target.value } })
              }
            />
          </Label>
          <Label t="Kısa açıklama" full>
            <textarea
              className={`${area} h-20`}
              value={form.identity.description}
              onChange={(e) =>
                setForm({ ...form, identity: { ...form.identity, description: e.target.value } })
              }
            />
          </Label>
          <div className="sm:col-span-2">
            <ImageManager
              images={form.identity.logo ? [form.identity.logo] : []}
              onChange={(next) =>
                setForm({ ...form, identity: { ...form.identity, logo: next[0] ?? '' } })
              }
              folder="content"
              multiple={false}
              label="Marka logosu"
            />
          </div>
          <Label t="Favicon URL (PNG/ICO)" full>
            <input
              className={field}
              value={form.identity.favicon}
              onChange={(e) =>
                setForm({ ...form, identity: { ...form.identity, favicon: e.target.value } })
              }
              placeholder="/favicon.ico"
            />
            {form.identity.favicon && (
              <span className="mt-2 flex items-center gap-2 text-xs text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.identity.favicon}
                  alt=""
                  className="h-6 w-6 rounded border border-border object-contain"
                />
                Favicon önizlemesi
              </span>
            )}
          </Label>
        </div>
      </div>

      <div className={`mt-6 grid gap-6 lg:grid-cols-2 ${hide('general')}`}>
        <NavOrderEditor
          title="Navigasyon"
          hint="Ana menü sırası ve görünürlüğü. Etiketleri Site Metinleri → Nav bölümünden düzenleyin."
          items={form.nav}
          labels={navLabels}
          onChange={(nav) => setForm({ ...form, nav })}
        />
        <NavOrderEditor
          title="Footer bağlantıları"
          hint="Footer'daki kurumsal bağlantıların sırası ve görünürlüğü."
          items={form.footerNav}
          labels={navLabels}
          onChange={(footerNav) => setForm({ ...form, footerNav })}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className={`${section} ${hide('contact')}`}>
          <p className="font-medium">İletişim</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Telefon *">
              <input
                className={field}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Label>
            <Label t="Telefon 2 (depo)">
              <input
                className={field}
                value={form.phone2}
                onChange={(e) => setForm({ ...form, phone2: e.target.value })}
              />
            </Label>
            <Label t="WhatsApp linki">
              <input
                className={field}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </Label>
            <Label t="E-posta">
              <input
                className={field}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Label>
            <Label t="Çalışma saatleri (TR)" full>
              <input
                className={field}
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
              />
            </Label>
            <Label t="Çalışma saatleri (EN)" full>
              <input
                className={field}
                value={form.hoursEn}
                onChange={(e) => setForm({ ...form, hoursEn: e.target.value })}
              />
            </Label>
            <Label t="Çalışma saatleri (AR)" full>
              <input
                className={field}
                dir="rtl"
                value={form.hoursAr}
                onChange={(e) => setForm({ ...form, hoursAr: e.target.value })}
              />
            </Label>
          </div>
        </div>

        <div className={`${section} ${hide('contact')}`}>
          <p className="font-medium">Adres & Sosyal</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Adres satırı" full>
              <input
                className={field}
                value={form.address.street}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, street: e.target.value } })
                }
              />
            </Label>
            <Label t="İlçe">
              <input
                className={field}
                value={form.address.locality}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, locality: e.target.value } })
                }
              />
            </Label>
            <Label t="İl">
              <input
                className={field}
                value={form.address.region}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, region: e.target.value } })
                }
              />
            </Label>
            <Label t="Posta kodu">
              <input
                className={field}
                value={form.address.postalCode}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })
                }
              />
            </Label>
            <Label t="İş yeri koordinatları (enlem,boylam)" full>
              <input
                className={field}
                value={form.address.coords}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, coords: e.target.value } })
                }
                placeholder="36.238639,36.176806"
              />
            </Label>
            <p className="text-xs text-muted sm:col-span-2">
              Ondalık (36.238639,36.176806) ya da DMS (36°14&#39;19.1&quot;N 36°10&#39;36.5&quot;E)
              girebilirsiniz; kaydederken ondalığa çevrilir.
            </p>
            <Label t="Instagram">
              <input
                className={field}
                value={form.social.instagram}
                onChange={(e) =>
                  setForm({ ...form, social: { ...form.social, instagram: e.target.value } })
                }
              />
            </Label>
            <Label t="Facebook">
              <input
                className={field}
                value={form.social.facebook}
                onChange={(e) =>
                  setForm({ ...form, social: { ...form.social, facebook: e.target.value } })
                }
              />
            </Label>
            <Label t="YouTube">
              <input
                className={field}
                value={form.social.youtube}
                onChange={(e) =>
                  setForm({ ...form, social: { ...form.social, youtube: e.target.value } })
                }
              />
            </Label>
            <Label t="LinkedIn">
              <input
                className={field}
                value={form.social.linkedin}
                onChange={(e) =>
                  setForm({ ...form, social: { ...form.social, linkedin: e.target.value } })
                }
              />
            </Label>
            <Label t="X (Twitter)" full>
              <input
                className={field}
                value={form.social.x}
                onChange={(e) =>
                  setForm({ ...form, social: { ...form.social, x: e.target.value } })
                }
              />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('contact')}`}>
          <p className="font-medium">Depo konumu</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Depo adresi (opsiyonel)" full>
              <input
                className={field}
                value={form.warehouse.address}
                onChange={(e) =>
                  setForm({ ...form, warehouse: { ...form.warehouse, address: e.target.value } })
                }
              />
            </Label>
            <Label t="Depo koordinatları (enlem,boylam)" full>
              <input
                className={field}
                value={form.warehouse.coords}
                onChange={(e) =>
                  setForm({ ...form, warehouse: { ...form.warehouse, coords: e.target.value } })
                }
                placeholder="36.250556,36.181472"
              />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('contact')}`}>
          <p className="font-medium">Açılış saatleri</p>
          <p className="mt-1 text-sm text-muted-strong">
            İletişim sayfasındaki &quot;şu an açık/kapalı&quot; rozeti bu çizelgeye göre hesaplanır
            (Europe/Istanbul).
          </p>
          <div className="mt-5 grid gap-3">
            {DAY_LABELS_TR.map((dayName, idx) => {
              const day = form.openHours[idx] ?? null;
              return (
                <div
                  key={dayName}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-2.5"
                >
                  <span className="w-24 text-sm font-medium">{dayName}</span>
                  <label className="inline-flex items-center gap-2 text-xs text-muted-strong">
                    <input
                      type="checkbox"
                      checked={!day}
                      onChange={(e) =>
                        setOpenHoursDay(
                          idx,
                          e.target.checked ? null : { open: '09:00', close: '18:00' },
                        )
                      }
                    />
                    Kapalı
                  </label>
                  <input
                    type="time"
                    value={day?.open ?? ''}
                    disabled={!day}
                    onChange={(e) => day && setOpenHoursDay(idx, { ...day, open: e.target.value })}
                    aria-label={`${dayName} açılış`}
                    className="h-9 rounded-md border border-border bg-surface px-3 text-sm outline-none disabled:opacity-40"
                  />
                  <span className="text-muted" aria-hidden>
                    –
                  </span>
                  <input
                    type="time"
                    value={day?.close ?? ''}
                    disabled={!day}
                    onChange={(e) => day && setOpenHoursDay(idx, { ...day, close: e.target.value })}
                    aria-label={`${dayName} kapanış`}
                    className="h-9 rounded-md border border-border bg-surface px-3 text-sm outline-none disabled:opacity-40"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('content')}`}>
          <p className="font-medium">Kampanya popup</p>
          <p className="mt-1 text-sm text-muted-strong">
            Siteye girişte bir kez gösterilen kampanya modalı (günde 1 kez).
          </p>
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
              <Dropdown
                className="w-full"
                ariaLabel="Gösterilecek kampanya"
                align="start"
                triggerClassName="bg-surface"
                value={form.popupCampaignId}
                onChange={(v) => setForm({ ...form, popupCampaignId: v })}
                options={[
                  { value: '', label: 'İlk aktif kampanya' },
                  ...campaigns.map((c) => ({ value: c.id, label: c.title })),
                ]}
              />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('content')}`}>
          <p className="font-medium">Webhook</p>
          <p className="mt-1 text-sm text-muted-strong">
            Tanımlanırsa olaylarda (ör. yeni teklif) JSON POST atılır. Slack/CRM/e-posta
            entegrasyonları bu URL üzerinden yapılabilir.
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

        <div className={`${section} lg:col-span-2 ${hide('content')}`}>
          <p className="font-medium">SEO / Meta</p>
          <p className="mt-1 text-sm text-muted-strong">
            Boş bırakılırsa site varsayılanları kullanılır. OG görseli tam URL veya /yol olabilir.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="Site başlığı (SEO title)" full>
              <input
                className={field}
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </Label>
            <Label t="Site açıklaması (meta description)" full>
              <textarea
                className={`${area} h-20`}
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              />
            </Label>
            <Label t="OG görseli" full>
              <input
                className={field}
                value={form.ogImage}
                onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                placeholder="/images/og-home.jpg"
              />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('content')}`}>
          <p className="font-medium">Ana sayfa arka planı (hero)</p>
          <p className="mt-1 text-sm text-muted-strong">
            Sayfanın en üstündeki büyük arka plan görseli. Boş bırakılırsa varsayılan görsel
            kullanılır. Ara sıra değiştirmek için yükleyin veya kaldırın.
          </p>
          <div className="mt-5">
            <ImageManager
              images={form.heroImage ? [form.heroImage] : []}
              onChange={(next) => setForm({ ...form, heroImage: next[0] ?? '' })}
              folder="content"
              multiple={false}
              label="Arka plan görseli"
            />
          </div>
        </div>

        <div className={`${section} ${hide('content')}`}>
          <p className="font-medium">Analitik</p>
          <p className="mt-1 text-sm text-muted-strong">
            Yalnızca çerez onayı verildiğinde yüklenir.
          </p>
          <div className="mt-5 grid gap-4">
            <Label t="Google Analytics ölçüm kimliği">
              <input
                className={field}
                value={form.gaMeasurementId}
                onChange={(e) => setForm({ ...form, gaMeasurementId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
              />
            </Label>
            <Label t="Meta Pixel kimliği">
              <input
                className={field}
                value={form.metaPixelId}
                onChange={(e) => setForm({ ...form, metaPixelId: e.target.value })}
                placeholder="1234567890"
              />
            </Label>
          </div>
        </div>

        <div className={`${section} ${hide('general')}`}>
          <p className="font-medium">Bakım modu</p>
          <p className="mt-1 text-sm text-muted-strong">
            Açıkken public site bakım sayfasına yönlenir. Admin ve API etkilenmez.
          </p>
          <label className="mt-5 flex h-11 items-center gap-3 rounded-md border border-border bg-surface px-4">
            <input
              type="checkbox"
              checked={form.maintenance}
              onChange={(e) => setForm({ ...form, maintenance: e.target.checked })}
            />
            <span className="text-sm">Bakım modunu etkinleştir</span>
          </label>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('email')}`}>
          <p className="font-medium">SMTP / teklif bildirimi</p>
          <p className="mt-1 text-sm text-muted-strong">
            Yeni teklif geldiğinde bildirim e-postası gönderilir. Gönderim başarısız olsa da teklif
            kaydedilir.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Label t="SMTP sunucu">
              <input
                className={field}
                value={form.smtp.host}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, host: e.target.value } })}
                placeholder="smtp.example.com"
              />
            </Label>
            <Label t="Port">
              <input
                className={field}
                value={form.smtp.port}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, port: e.target.value } })}
                placeholder="587"
              />
            </Label>
            <Label t="Kullanıcı">
              <input
                className={field}
                value={form.smtp.user}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, user: e.target.value } })}
              />
            </Label>
            <Label t="Şifre">
              <input
                className={field}
                type="password"
                autoComplete="new-password"
                value={form.smtp.pass}
                placeholder={smtpPassSet ? '•••••• (değiştirmek için yazın)' : ''}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, pass: e.target.value } })}
              />
            </Label>
            <Label t="Gönderen adresi (From)">
              <input
                className={field}
                value={form.smtp.from}
                onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, from: e.target.value } })}
                placeholder="Bozkır Ağaç <no-reply@...>"
              />
            </Label>
            <Label t="Bildirim alıcısı">
              <input
                className={field}
                value={form.notifyEmail}
                onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })}
                placeholder="info@bozkiragac.com"
              />
            </Label>
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('email')}`}>
          <p className="font-medium">WhatsApp mesaj şablonları</p>
          <p className="mt-1 text-sm text-muted-strong">
            Genel mesaj ve ürün mesajı. Yer tutucular: <code>{'{product}'}</code>,{' '}
            <code>{'{code}'}</code>, <code>{'{category}'}</code>, <code>{'{url}'}</code>. Ürün
            bazlı mesaj boşsa ürün şablonu, o da boşsa genel şablon kullanılır.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(['tr', 'en', 'ar'] as const).map((lang) => (
              <Label key={`wa-general-${lang}`} t={`Genel mesaj (${lang.toUpperCase()})`} full>
                <textarea
                  className={`${area} h-24`}
                  dir={lang === 'ar' ? 'rtl' : undefined}
                  value={form.whatsappMessages.general[lang]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsappMessages: {
                        ...form.whatsappMessages,
                        general: { ...form.whatsappMessages.general, [lang]: e.target.value },
                      },
                    })
                  }
                />
              </Label>
            ))}
            {(['tr', 'en', 'ar'] as const).map((lang) => (
              <Label key={`wa-product-${lang}`} t={`Ürün mesajı (${lang.toUpperCase()})`} full>
                <textarea
                  className={`${area} h-24`}
                  dir={lang === 'ar' ? 'rtl' : undefined}
                  value={form.whatsappMessages.product[lang]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsappMessages: {
                        ...form.whatsappMessages,
                        product: { ...form.whatsappMessages.product, [lang]: e.target.value },
                      },
                    })
                  }
                />
              </Label>
            ))}
          </div>
        </div>

        <div className={`${section} lg:col-span-2 ${hide('legal')}`}>
          <p className="font-medium">Yasal metinler</p>
          <p className="mt-1 text-sm text-muted-strong">
            Doldurulursa ilgili yasal sayfa sözlük yerine bu metni gösterir. Paragraflar boş
            satırla ayrılır. Boş bırakılan sayfalar varsayılan metni kullanır.
          </p>
          <div className="mt-5 grid gap-5">
            <Label t="KVKK aydınlatma metni" full>
              <textarea
                className={`${area} h-32`}
                value={form.kvkkText}
                onChange={(e) => setForm({ ...form, kvkkText: e.target.value })}
                placeholder="6698 sayılı KVKK kapsamında aydınlatma metni..."
              />
            </Label>
            <Label t="Gizlilik politikası metni" full>
              <textarea
                className={`${area} h-32`}
                value={form.privacyText}
                onChange={(e) => setForm({ ...form, privacyText: e.target.value })}
                placeholder="Gizlilik politikası..."
              />
            </Label>
            <Label t="Çerez politikası metni" full>
              <textarea
                className={`${area} h-32`}
                value={form.cookiePolicyText}
                onChange={(e) => setForm({ ...form, cookiePolicyText: e.target.value })}
                placeholder="Bu sitede ... çerezler kullanılmaktadır.&#10;&#10;..."
              />
            </Label>
          </div>
        </div>
      </div>

      <div className={`${section} mt-6 ${hide('content')}`}>
        <p className="font-medium">Vitrin kategori sırası</p>
        <p className="mt-1 text-sm text-muted-strong">
          Anasayfadaki &quot;Malzeme koleksiyonu&quot; ve &quot;Malzemeyi Keşfet&quot; bölümlerinin
          sırası.
        </p>
        <ul className="mt-5 divide-y divide-border">
          {order.map((slug, i) => (
            <li key={slug} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>
                <span className="numerals mr-3 text-xs text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {nameOf(slug)}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Yukarı"
                  className="rounded-md border border-border p-1.5 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label="Aşağı"
                  className="rounded-md border border-border p-1.5 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOrder(order.filter((s) => s !== slug))}
                  aria-label={`${nameOf(slug)} kaldır`}
                  className="rounded-md border border-border p-1.5 text-muted-strong hover:border-red-300 hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
        {order.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed border-border p-4 text-center text-xs text-muted">
            Vitrinde listelenecek kategori yok.
          </p>
        )}
        {unused.length > 0 && (
          <div className="mt-4">
            <Select
              aria-label="Vitrin sırasına kategori ekle"
              shape="rounded"
              selectClassName="h-11 bg-surface"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) setOrder([...order, v]);
              }}
            >
              <option value="">Kategori ekle…</option>
              {unused.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOrder(categories.map((c) => c.slug))}
          className="mt-3 text-xs text-muted underline"
        >
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
        {msg && (
          <p className={msg.ok ? 'text-sm text-success' : 'text-sm text-danger'}>{msg.text}</p>
        )}
      </div>
    </form>
  );
}

function NavOrderEditor({
  title,
  hint,
  items,
  labels,
  onChange,
}: {
  title: string;
  hint: string;
  items: NavSettingItem[];
  labels: Record<string, string>;
  onChange: (items: NavSettingItem[]) => void;
}) {
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-strong">{hint}</p>
      <ul className="mt-5 divide-y divide-border">
        {items.map((item, i) => (
          <li key={item.key} className="flex items-center gap-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(e) =>
                onChange(
                  items.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)),
                )
              }
              aria-label={`${labels[item.key] ?? item.key} görünür`}
            />
            <span className={item.visible ? 'flex-1' : 'flex-1 text-muted'}>
              <span className="block">{labels[item.key] ?? item.key}</span>
              <span className="block text-xs text-muted">{item.href}</span>
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Yukarı"
                className="rounded-md border border-border p-1.5 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Aşağı"
                className="rounded-md border border-border p-1.5 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
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
