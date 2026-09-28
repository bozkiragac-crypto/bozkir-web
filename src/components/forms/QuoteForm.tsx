'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { track } from '@/lib/analytics';
import { submitQuote } from '@/lib/api/quote';
import { Button } from '@/components/ui/Button';

const MAX_FILE_MB = 10;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/vnd.dwg', 'application/acad'];

const schema = z.object({
  fullName: z.string().min(2, 'Ad Soyad giriniz'),
  company: z.string().optional(),
  phone: z
    .string()
    .min(10, 'Telefon numarası giriniz')
    .regex(/[0-9]{10,}/, 'Geçerli bir telefon giriniz'),
  email: z.string().email('Geçerli bir e-posta giriniz'),
  product: z.string().optional(),
  quantity: z.string().optional(),
  dimensions: z.string().optional(),
  note: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, { message: 'Devam etmek için onay verin' }),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';

export function QuoteForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!f) return setFile(null);
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Dosya boyutu en fazla ${MAX_FILE_MB} MB olabilir.`);
      return setFile(null);
    }
    if (!ALLOWED.includes(f.type) && !/\.(pdf|jpe?g|png|dwg)$/i.test(f.name)) {
      setFileError('Yalnızca PDF, JPG, PNG veya DWG yükleyebilirsiniz.');
      return setFile(null);
    }
    setFile(f);
  }

  async function onSubmit(values: FormValues) {
    setResult(null);
    track('quote_submit', { product: values.product });
    const res = await submitQuote(
      {
        fullName: values.fullName,
        company: values.company,
        phone: values.phone,
        email: values.email,
        product: values.product,
        quantity: values.quantity,
        dimensions: values.dimensions,
        note: values.note,
      },
      file,
    );
    setResult(res);
    if (res.ok) reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onFocus={() => track('quote_start')} noValidate className="grid gap-5">
      {/* Bot tuzağı: gerçek kullanıcı görmez/görmezden gelir. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ad Soyad *" error={errors.fullName?.message}>
          <input className={fieldClass} {...register('fullName')} autoComplete="name" />
        </Field>
        <Field label="Firma" error={errors.company?.message}>
          <input className={fieldClass} {...register('company')} autoComplete="organization" />
        </Field>
        <Field label="Telefon *" error={errors.phone?.message}>
          <input className={fieldClass} {...register('phone')} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="E-posta *" error={errors.email?.message}>
          <input className={fieldClass} {...register('email')} inputMode="email" autoComplete="email" />
        </Field>
        <Field label="Ürün / Kategori" error={errors.product?.message}>
          <input className={fieldClass} {...register('product')} placeholder="Örn: MDF Lam" />
        </Field>
        <Field label="Adet" error={errors.quantity?.message}>
          <input className={fieldClass} {...register('quantity')} inputMode="numeric" />
        </Field>
      </div>

      <Field label="Ölçü" error={errors.dimensions?.message}>
        <input className={fieldClass} {...register('dimensions')} placeholder="Örn: 2800 x 2100 x 18 mm" />
      </Field>

      <Field label="Not" error={errors.note?.message}>
        <textarea
          className="min-h-28 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
          {...register('note')}
        />
      </Field>

      <Field label="Dosya (PDF, JPG, PNG, DWG · en fazla 10 MB)" error={fileError ?? undefined}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.dwg"
          onChange={onFileChange}
          className="w-full rounded-md border border-dashed border-border bg-surface px-4 py-3 text-sm"
        />
      </Field>

      <label className="flex items-start gap-3 text-sm text-muted-strong">
        <input type="checkbox" {...register('consent')} className="mt-1" />
        <span>Teklif amacıyla iletişime geçilmesini ve verilerimin işlenmesini kabul ediyorum.</span>
      </label>
      {errors.consent && <p className="text-sm text-red-600">{errors.consent.message}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Gönderiliyor...' : 'Teklif İste'}
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
