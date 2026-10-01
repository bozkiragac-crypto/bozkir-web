'use client';

import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, MessageCircle, Phone } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { track } from '@/lib/analytics';
import { submitQuote } from '@/lib/api/quote';
import { Button } from '@/components/ui/Button';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { siteConfig } from '@/config/site';

const MAX_FILE_MB = 10;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/vnd.dwg', 'application/acad'];

export interface QuoteProduct {
  id: string;
  slug: string;
  name: string;
  code?: string;
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
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';

export function QuoteForm({ products }: { products?: QuoteProduct[] }) {
  const list = products && products.length > 0 ? products : [];
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [sent, setSent] = useState(false);
  const [excluded, setExcluded] = useState<string[]>([]);
  const { t } = useDictionary();

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

  const active = list.filter((p) => !excluded.includes(p.slug));
  const label = (p: QuoteProduct) => `${p.name}${p.code ? ` (${p.code})` : ''}`;
  const productLabel = active.map(label).join(', ');

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

  function removeProduct(slug: string) {
    setExcluded((prev) => {
      const next = [...prev, slug];
      const remaining = list.filter((p) => !next.includes(p.slug)).map(label).join(', ');
      setValue('product', remaining);
      return next;
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
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

  async function onSubmit(values: FormValues) {
    setResult(null);
    const slugs = active.map((p) => p.slug).join(',');
    track('quote_submit', { product: values.product, product_slug: slugs });
    const res = await submitQuote(
      {
        fullName: values.fullName,
        company: values.company,
        phone: values.phone,
        email: values.email,
        product: values.product,
        productId: active.length === 1 ? (active[0]?.id ?? '') : '',
        productSlug: slugs,
        quantity: values.quantity,
        dimensions: values.dimensions,
        note: values.note,
        consent: values.consent,
      },
      file,
    );
    if (res.ok) {
      setSent(true);
      reset({ product: productLabel });
      return;
    }
    const message =
      res.status === 429
        ? t('quote.errorRate')
        : res.status === 422
          ? t('quote.errorValidation')
          : t('quote.errorGeneric');
    setResult({ ok: false, message });
  }

  const waHref = `${siteConfig.whatsapp}?text=${encodeURIComponent(t('pages.whatsapp.message'))}`;

  if (sent) {
    return (
      <div role="status" aria-live="polite" className="rounded-xl border border-border bg-surface p-8">
        <p className="text-lg font-medium text-success">{t('quote.success')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { source: 'quote_success' })}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-medium text-white"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
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
    <form onSubmit={handleSubmit(onSubmit)} onFocus={() => track('quote_start')} noValidate className="grid gap-5">
      {/* Bot tuzağı: gerçek kullanıcı görmez/görmezden gelir. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {active.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">
            {active.length > 1 ? t('quote.selectedProducts') : t('quote.selectedProduct')}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {active.map((p) => (
              <li key={p.slug} className="flex items-center gap-4">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-14 w-14 flex-none rounded object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.name}
                    {p.code && <span className="numerals ms-2 text-sm text-muted-strong">{p.code}</span>}
                  </p>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={`${t('quote.fullName')} *`} error={errors.fullName?.message}>
          <input id="fullName" className={fieldClass} {...register('fullName')} autoComplete="name" />
        </Field>
        <Field id="company" label={t('quote.company')} error={errors.company?.message}>
          <input id="company" className={fieldClass} {...register('company')} autoComplete="organization" />
        </Field>
        <Field id="phone" label={`${t('quote.phone')} *`} error={errors.phone?.message}>
          <input id="phone" className={fieldClass} {...register('phone')} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field id="email" label={`${t('quote.email')} *`} error={errors.email?.message}>
          <input id="email" className={fieldClass} {...register('email')} inputMode="email" autoComplete="email" />
        </Field>
        <Field id="product" label={t('quote.productField')} error={errors.product?.message}>
          <input
            id="product"
            className={`${fieldClass} ${active.length > 0 ? 'opacity-70' : ''}`}
            {...register('product')}
            readOnly={active.length > 0}
            placeholder={t('quote.productPlaceholder')}
          />
        </Field>
        <Field id="quantity" label={t('quote.quantity')} error={errors.quantity?.message}>
          <input id="quantity" className={fieldClass} {...register('quantity')} inputMode="numeric" />
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
          className="min-h-28 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
          {...register('note')}
        />
      </Field>

      <Field id="attachment" label={`${t('quote.attachment')} (${t('quote.attachmentHint')})`} error={fileError ?? undefined}>
        <input
          id="attachment"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.dwg"
          onChange={onFileChange}
          className="w-full rounded-md border border-dashed border-border bg-surface px-4 py-3 text-sm"
        />
      </Field>

      <div>
        <label className="flex items-start gap-3 text-sm text-muted-strong">
          <input
            type="checkbox"
            {...register('consent')}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            className="mt-1"
          />
          <span>
            {t('quote.consent')}{' '}
            <Link href="/kvkk" className="underline underline-offset-4 hover:text-foreground">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full justify-center sm:w-auto">
          {isSubmitting ? t('quote.submitting') : t('quote.submit')}
        </Button>
        {result && !result.ok && (
          <p className="text-sm text-danger" role="alert">
            {result.message}
          </p>
        )}
      </div>
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
