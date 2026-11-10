'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Link2, Check, Smartphone } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

/** Menü genişliği (sm+ ekranlarda `w-60` ile eşleşir). */
const MENU_WIDTH = 240;
/** Menü öğesi yüksekliği + kenarlıklar (konum hesabı için yaklaşık). */
const MENU_ITEM_HEIGHT = 45;

/**
 * Ürün paylaşımı: WhatsApp linki (OG önizlemeli), yerel paylaşım (mobilde görsel
 * dosyası ile) ve bağlantı kopyalama. Mobilde destekleniyorsa Web Share kullanılır.
 *
 * Menü portal ile `body` altına taşınır: hızlı bakış (quick view) gibi taşan
 * kapsayıcıların içinde kırpılmaz; ekranın altına sığmazsa yukarı açılır.
 */
export function ShareButton({
  name,
  url,
  imageUrl,
  className,
  message,
}: {
  name: string;
  url: string;
  imageUrl?: string;
  className?: string;
  /** Ürün bazlı WhatsApp metni; boşsa sözlükteki genel ürün şablonu. */
  message?: string;
}) {
  const { dict } = useDictionary();
  const c = dict.common;
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const text =
    message?.trim() ||
    dict.pages.whatsapp.productMessage
      .replace('{product}', name)
      .replace('{url}', url)
      .replace(/\s+/g, ' ')
      .trim();
  const waHref = `https://wa.me/?text=${encodeURIComponent(text)}`;

  /** Masaüstünde menüyü düğmeye hizalar; altında yer yoksa yukarı açar. */
  function measureMenu(): { top: number; left: number } | null {
    if (!ref.current || typeof window === 'undefined') return null;
    if (!window.matchMedia('(min-width: 640px)').matches) return null;
    const rect = ref.current.getBoundingClientRect();
    const height = (canNative ? 3 : 2) * MENU_ITEM_HEIGHT + 2;
    const gap = 8;
    const margin = 12;
    const rtl = document.documentElement.dir === 'rtl';
    const rawLeft = rtl ? rect.left : rect.right - MENU_WIDTH;
    const left = Math.max(margin, Math.min(rawLeft, window.innerWidth - MENU_WIDTH - margin));
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - height - gap);
    }
    return { top, left };
  }

  // Açıkken ekran/kapsayıcı kaydırmasında menüyü düğmeye bağlı tut.
  useEffect(() => {
    if (!open) return;
    const update = () => setMenuPos(measureMenu());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
    // `measureMenu` yalnızca `canNative` durumuna bağlı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canNative]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    setMenuPos(measureMenu());
    setOpen(true);
  }

  const item =
    'flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-surface-2';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMenu();
        }}
        aria-label={c.shareMenu}
        aria-expanded={open}
        title={c.shareMenu}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition active:scale-95 hover:border-foreground',
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={
              menuPos ? { top: menuPos.top, left: menuPos.left, width: MENU_WIDTH } : undefined
            }
            className={cn(
              'z-[400] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]',
              // Mobil: alt-sayfa (taşmayı önler). sm+ : düğmeye hizalı açılır menü.
              menuPos
                ? 'fixed'
                : 'fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]',
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
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
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> {c.shareWhatsapp}
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
          </div>,
          document.body,
        )}
    </div>
  );
}
