'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { track } from '@/lib/analytics';
import { submitQuote } from '@/lib/api/quote';
import { Button } from '@/components/ui/Button';
import { useDictionary } from '@/i18n/DictionaryProvider';

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
      },
      file,
    );
    setResult({ ok: res.ok, message: res.ok ? t('quote.success') : t('quote.errorGeneric') });
    if (res.ok) reset({ product: productLabel });
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
                    {p.code && <span className="numerals ml-2 text-sm text-muted-strong">{p.code}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(p.slug)}
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border text-muted-strong transition hover:border-foreground hover:text-foreground"
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
        <Field label={`${t('quote.fullName')} *`} error={errors.fullName?.message}>
          <input className={fieldClass} {...register('fullName')} autoComplete="name" />
        </Field>
        <Field label={t('quote.company')} error={errors.company?.message}>
          <input className={fieldClass} {...register('company')} autoComplete="organization" />
        </Field>
        <Field label={`${t('quote.phone')} *`} error={errors.phone?.message}>
          <input className={fieldClass} {...register('phone')} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label={`${t('quote.email')} *`} error={errors.email?.message}>
          <input className={fieldClass} {...register('email')} inputMode="email" autoComplete="email" />
        </Field>
        <Field label={t('quote.productField')} error={errors.product?.message}>
          <input
            className={`${fieldClass} ${active.length > 0 ? 'opacity-70' : ''}`}
            {...register('product')}
            readOnly={active.length > 0}
            placeholder={t('quote.productPlaceholder')}
          />
        </Field>
        <Field label={t('quote.quantity')} error={errors.quantity?.message}>
          <input className={fieldClass} {...register('quantity')} inputMode="numeric" />
        </Field>
      </div>

      <Field label={t('quote.dimensionsField')} error={errors.dimensions?.message}>
        <input className={fieldClass} {...register('dimensions')} placeholder={t('quote.dimensionsPlaceholder')} />
      </Field>

      <Field label={t('quote.note')} error={errors.note?.message}>
        <textarea
          className="min-h-28 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
          {...register('note')}
        />
      </Field>

        <Field label={`${t('quote.attachment')} (${t('quote.attachmentHint')})`} error={fileError ?? undefined}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.dwg"
          onChange={onFileChange}
          className="w-full rounded-md border border-dashed border-border bg-surface px-4 py-3 text-sm"
        />
      </Field>

      <label className="flex items-start gap-3 text-sm text-muted-strong">
        <input type="checkbox" {...register('consent')} className="mt-1" />
        <span>{t('quote.consent')}</span>
      </label>
      {errors.consent && <p className="text-sm text-red-600">{errors.consent.message}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full justify-center sm:w-auto">
          {isSubmitting ? t('quote.submitting') : t('quote.submit')}
        </Button>
        {result && (
          <p className={result.ok ? 'text-sm text-green-700' : 'text-sm text-red-600'} role="status">
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-[0.14em] text-muted uppercase">{label}</span>
      {children}
      {error && <span className="mt-2 block text-sm text-red-600">{error}</span>}
    </label>
  );
}
