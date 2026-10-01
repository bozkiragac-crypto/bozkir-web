'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, MessageCircle, Link2, Check, Smartphone } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

/**
 * Ürün paylaşımı: WhatsApp linki (OG önizlemeli), yerel paylaşım (mobilde görsel
 * dosyası ile) ve bağlantı kopyalama. Mobilde destekleniyorsa Web Share kullanılır.
 */
export function ShareButton({
  name,
  url,
  imageUrl,
  className,
}: {
  name: string;
  url: string;
  imageUrl?: string;
  className?: string;
}) {
  const { dict } = useDictionary();
  const c = dict.common;
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const text = dict.pages.whatsapp.productMessage
    .replace('{product}', name)
    .replace('{url}', url)
    .replace(/\s+/g, ' ')
    .trim();
  const waHref = `https://wa.me/?text=${encodeURIComponent(text)}`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(c.copied);
      track('share', { channel: 'copy', name });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // yok say
    }
  }

  async function nativeShare() {
    if (typeof navigator === 'undefined' || !navigator.share) return;
    track('share', { channel: 'native', name });
    try {
      const shareData: ShareData = { title: name, text, url };
      // Görsel dosyasını iliştirmeyi dene (mobil; https).
      if (imageUrl && navigator.canShare) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          const file = new File([blob], `${name}.${ext}`, { type: blob.type || 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) shareData.files = [file];
        } catch {
          // görsel eklenemezse metin+link ile paylaş
        }
      }
      await navigator.share(shareData);
      setOpen(false);
    } catch {
      // kullanıcı iptal etti / desteklenmedi
    }
  }

  const item =
    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-2';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={c.shareMenu}
        aria-expanded={open}
        title={c.shareMenu}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition hover:border-foreground',
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-[120] mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track('share', { channel: 'whatsapp', name });
              setOpen(false);
            }}
            className={item}
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" /> {c.shareWhatsapp}
          </a>

          {canNative && (
            <button type="button" onClick={nativeShare} className={item}>
              <Smartphone className="h-4 w-4" /> {c.shareNative}
            </button>
          )}

          <button type="button" onClick={copyLink} className={item}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
            {copied ? c.copied : c.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
