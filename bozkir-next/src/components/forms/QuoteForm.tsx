'use client';

import {
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Phone, Paperclip, CheckCircle2, Plus, Search } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { track } from '@/lib/analytics';
import { submitQuote } from '@/lib/api/quote';
import { filterQuoteProducts } from '@/lib/quote-picker';
import { MAX_QUOTE_PRODUCTS } from '@/lib/quote-products';
import { Button } from '@/components/ui/Button';
import { TurnstileWidget } from '@/components/forms/TurnstileWidget';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const MAX_FILE_MB = 10;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/vnd.dwg', 'application/acad'];

export interface QuoteProduct {
  id: string;
  slug: string;
  name: string;
  code?: string;
  category?: string;
  image?: string;
}

interface FormValues {
  fullName: string;
  company?: string;
  phone: string;
  email: string;
  product?: string;
  quantity?: string;
  dimensions?: string;
  note?: string;
  consent: boolean;
}

const fieldClass =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-base outline-none transition-colors focus:border-foreground sm:text-sm';

export function QuoteForm({
  products,
  pickerProducts,
  turnstileSiteKey = '',
  whatsappLink,
}: {
  products?: QuoteProduct[];
  /** Teklif formundaki aranabilir ürün seçicisi için tüm aktif ürünler. */
  pickerProducts?: QuoteProduct[];
  turnstileSiteKey?: string;
  /** Ayarlardaki genel WhatsApp şablonuyla hazırlanmış bağlantı. */
  whatsappLink?: string;
}) {
  const [selected, setSelected] = useState<QuoteProduct[]>(products ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { t } = useDictionary();

  const pickerList = useMemo(() => {
    const bySlug = new Map<string, QuoteProduct>();
    for (const product of pickerProducts ?? []) bySlug.set(product.slug, product);
    // Bağlantıdan gelen ürün, tüm liste henüz yüklenmemiş olsa da seçili kalır.
    for (const product of products ?? []) {
      if (!bySlug.has(product.slug)) bySlug.set(product.slug, product);
    }
    return [...bySlug.values()];
  }, [pickerProducts, products]);

  const selectedSlugs = useMemo(() => selected.map((p) => p.slug), [selected]);
  const results = useMemo(
    () => filterQuoteProducts(pickerList, pickerQuery, selectedSlugs, 8),
    [pickerList, pickerQuery, selectedSlugs],
  );
  const atLimit = selected.length >= MAX_QUOTE_PRODUCTS;

  const schema = z.object({
    fullName: z.string().min(2, t('quote.errors.name')),
    company: z.string().optional(),
    phone: z
      .string()
      .min(10, t('quote.errors.phone'))
      .regex(/[0-9]{10,}/, t('quote.errors.phoneValid')),
    email: z.string().email(t('quote.errors.email')),
    product: z.string().optional(),
    quantity: z.string().optional(),
    dimensions: z.string().optional(),
    note: z.string().optional(),
    consent: z.boolean().refine((v) => v === true, { message: t('quote.errors.consent') }),
  });

  const label = (p: QuoteProduct) => `${p.name}${p.code ? ` (${p.code})` : ''}`;
  const productLabel = selected.map(label).join(', ');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { product: productLabel },
  });

  // Seçilen ürünler form alanına ve gizli slug alanına yansır.
  useEffect(() => {
    setValue('product', selected.map((p) => `${p.name}${p.code ? ` (${p.code})` : ''}`).join(', '));
  }, [selected, setValue]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [pickerOpen]);

  function addProduct(product: QuoteProduct) {
    if (selected.some((p) => p.slug === product.slug)) return;
    if (selected.length >= MAX_QUOTE_PRODUCTS) {
      setPickerOpen(false);
      return;
    }
    setSelected((prev) => [...prev, product]);
    track('quote_product_add', { product: product.slug });
    setPickerQuery('');
    setPickerOpen(false);
  }

  function removeProduct(slug: string) {
    setSelected((prev) => prev.filter((p) => p.slug !== slug));
  }

  function onPickerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setPickerOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPickerOpen(true);
      setActiveIndex((i) => Math.min(Math.max(results.length - 1, 0), i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter' && pickerOpen && results[activeIndex]) {
      e.preventDefault();
      addProduct(results[activeIndex]!);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
  }

  function handleFile(f: File | null) {
    setFileError(null);
    if (!f) return setFile(null);
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(t('quote.errors.fileSize').replace('{max}', String(MAX_FILE_MB)));
      return setFile(null);
    }
    if (!ALLOWED.includes(f.type) && !/\.(pdf|jpe?g|png|dwg)$/i.test(f.name)) {
      setFileError(t('quote.errors.fileType'));
      return setFile(null);
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onSubmit(values: FormValues) {
    setResult(null);
    if (turnstileSiteKey && !turnstileToken) {
      setResult({ ok: false, message: t('quote.errorValidation') });
      return;
    }
    const slugs = selected.map((p) => p.slug).join(',');
    track('quote_submit', { product: values.product, product_slug: slugs });
    const res = await submitQuote(
      {
        fullName: values.fullName,
        company: values.company,
        phone: values.phone,
        email: values.email,
        product: values.product,
        productId: selected.length === 1 ? (selected[0]?.id ?? '') : '',
        productSlug: slugs,
        quantity: values.quantity,
        dimensions: values.dimensions,
        note: values.note,
        consent: values.consent,
        turnstileToken,
      },
      file,
    );
    if (res.ok) {
      setSent(true);
      reset({ product: productLabel });
      return;
    }
    // Token tek kullanımlık: başarısız gönderimden sonra yenile.
    if (turnstileSiteKey) {
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
    }
    const message =
      res.status === 429
        ? t('quote.errorRate')
        : res.status === 422
          ? t('quote.errorValidation')
          : t('quote.errorGeneric');
    setResult({ ok: false, message });
  }

  const waHref =
    whatsappLink ||
    `${siteConfig.whatsapp}?text=${encodeURIComponent(t('pages.whatsapp.message'))}`;

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="page-fade rounded-xl border border-border bg-surface p-8"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-success shadow-[0_0_0_6px_color-mix(in_srgb,currentColor_12%,transparent)]">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <p className="mt-4 text-lg font-medium text-success">{t('quote.success')}</p>
        {selected.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {selected.map((p) => (
              <li
                key={p.slug}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-strong"
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-muted-strong">{t('quote.description')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { source: 'quote_success' })}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-medium text-white"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href={siteConfig.phoneHref}
            onClick={() => track('phone_click', { source: 'quote_success' })}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium"
          >
            <Phone className="h-4 w-4" /> {siteConfig.phone}
          </a>
        </div>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-muted-strong underline underline-offset-4 hover:text-foreground"
        >
          {t('quote.submit')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocus={() => track('quote_start')}
      noValidate
      className="grid gap-5"
    >
      {/* Bot tuzağı: gerçek kullanıcı görmez/görmezden gelir. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      {selected.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">
            {selected.length > 1 ? t('quote.selectedProducts') : t('quote.selectedProduct')}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {selected.map((p) => (
              <li key={p.slug} className="flex items-center gap-4">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    className="h-16 w-16 flex-none rounded-lg object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  {p.code && (
                    <span className="numerals mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted-strong">
                      {p.code}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(p.slug)}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-border text-muted-strong transition hover:border-foreground hover:text-foreground"
                  aria-label={`${p.name} ${t('quote.removeProduct')}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div ref={pickerRef} className="relative">
        <label
          htmlFor="quote-product-picker"
          className="mb-2 block text-xs tracking-[0.14em] text-muted uppercase"
        >
          {t('quote.addProduct')}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id="quote-product-picker"
            type="text"
            role="combobox"
            aria-expanded={pickerOpen}
            aria-controls="quote-product-options"
            aria-autocomplete="list"
            aria-activedescendant={
              pickerOpen && results[activeIndex] ? `quote-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            value={pickerQuery}
            disabled={atLimit}
            onChange={(e) => {
              setPickerQuery(e.target.value);
              setPickerOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setPickerOpen(true)}
            onKeyDown={onPickerKeyDown}
            placeholder={t('quote.searchProduct')}
            className={cn(
              fieldClass,
              'ps-11 pe-10 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          />
          {pickerQuery && !atLimit && (
            <button
              type="button"
              aria-label={t('catalog.clear')}
              onClick={() => {
                setPickerQuery('');
                setPickerOpen(true);
              }}
              className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className={cn('mt-1.5 text-xs', atLimit ? 'text-muted-strong' : 'text-muted')}>
          {atLimit
            ? t('quote.limitNote').replace('{max}', String(MAX_QUOTE_PRODUCTS))
            : t('quote.productPickerHint')}
        </p>

        {pickerOpen && !atLimit && (
          <div
            id="quote-product-options"
            role="listbox"
            aria-label={t('quote.searchProduct')}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl"
          >
            {results.length === 0 ? (
              <p role="status" className="px-3 py-4 text-sm text-muted-strong">
                {t('quote.productSearchEmpty')}
              </p>
            ) : (
              results.map((product, index) => (
                <button
                  key={product.slug}
                  id={`quote-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => addProduct(product)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-start transition-colors',
                    index === activeIndex ? 'bg-surface-2' : 'hover:bg-surface-2',
                  )}
                >
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt=""
                      className="h-10 w-10 flex-none rounded-md object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-surface-2 text-muted">
                      <Search className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{product.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {[product.code, product.category].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 flex-none text-muted" aria-hidden />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={`${t('quote.fullName')} *`} error={errors.fullName?.message}>
          <input
            id="fullName"
            className={fieldClass}
            {...register('fullName')}
            autoComplete="name"
          />
        </Field>
        <Field id="company" label={t('quote.company')} error={errors.company?.message}>
          <input
            id="company"
            className={fieldClass}
            {...register('company')}
            autoComplete="organization"
          />
        </Field>
        <Field id="phone" label={`${t('quote.phone')} *`} error={errors.phone?.message}>
          <input
            id="phone"
            className={fieldClass}
            {...register('phone')}
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field id="email" label={`${t('quote.email')} *`} error={errors.email?.message}>
          <input
            id="email"
            className={fieldClass}
            {...register('email')}
            inputMode="email"
            autoComplete="email"
          />
        </Field>
        <Field id="product" label={t('quote.productField')} error={errors.product?.message}>
          <input
            id="product"
            className={`${fieldClass} ${selected.length > 0 ? 'opacity-70' : ''}`}
            {...register('product')}
            readOnly={selected.length > 0}
            placeholder={t('quote.productPlaceholder')}
          />
        </Field>
        <Field id="quantity" label={t('quote.quantity')} error={errors.quantity?.message}>
          <input
            id="quantity"
            className={fieldClass}
            {...register('quantity')}
            inputMode="numeric"
          />
        </Field>
      </div>

      <Field id="dimensions" label={t('quote.dimensionsField')} error={errors.dimensions?.message}>
        <input
          id="dimensions"
          className={fieldClass}
          {...register('dimensions')}
          placeholder={t('quote.dimensionsPlaceholder')}
        />
      </Field>

      <Field id="note" label={t('quote.note')} error={errors.note?.message}>
        <textarea
          id="note"
          className="min-h-28 w-full rounded-md border border-border bg-surface px-4 py-3 text-base outline-none transition-colors focus:border-foreground sm:text-sm"
          {...register('note')}
        />
      </Field>

      <div>
        <span className="mb-2 block text-xs tracking-[0.14em] text-muted uppercase">
          {t('quote.attachment')}
        </span>
        <label
          htmlFor="attachment"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-center text-sm transition-colors',
            dragging
              ? 'border-foreground bg-surface-2'
              : 'border-border bg-surface hover:border-border-strong',
          )}
        >
          <Paperclip className="h-4 w-4 text-muted" aria-hidden />
          <span className="text-muted-strong">{t('quote.attachmentHint')}</span>
          <input
            ref={fileInputRef}
            id="attachment"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.dwg"
            onChange={onFileChange}
            aria-invalid={fileError ? true : undefined}
            aria-describedby={fileError ? 'attachment-error' : undefined}
            className="sr-only"
          />
        </label>
        {file && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
            <Paperclip className="h-3.5 w-3.5 flex-none text-muted" aria-hidden />
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={clearFile}
              aria-label={t('catalog.clear')}
              className="flex h-6 w-6 flex-none items-center justify-center rounded-full hover:bg-surface-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {fileError && (
          <p id="attachment-error" role="alert" className="mt-2 text-sm text-danger">
            {fileError}
          </p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-muted-strong">
          <input
            type="checkbox"
            {...register('consent')}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            className="mt-0.5 h-4 w-4 flex-none accent-foreground"
          />
          <span>
            {t('quote.consent')}{' '}
            <Link
              href="/kvkk"
              className="tap-target underline underline-offset-4 hover:text-foreground"
            >
              {t('quote.consentLink')}
            </Link>
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="mt-2 text-sm text-danger">
            {errors.consent.message}
          </p>
        )}
      </div>

      {turnstileSiteKey && (
        <div className="flex justify-start">
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onToken={setTurnstileToken}
            resetSignal={turnstileReset}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full justify-center sm:w-auto"
        >
          {isSubmitting ? t('quote.submitting') : t('quote.submit')}
        </Button>
        {result && !result.ok && (
          <p className="text-sm text-danger" role="alert">
            {result.message}
          </p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted">{t('quote.privacyNote')}</p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const errorId = id ? `${id}-error` : undefined;
  const child =
    isValidElement(children) && error
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          'aria-invalid': true,
          'aria-describedby': errorId,
        })
      : children;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs tracking-[0.14em] text-muted uppercase">{label}</span>
      {child}
      {error && (
        <span id={errorId} role="alert" className="mt-2 block text-sm text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
