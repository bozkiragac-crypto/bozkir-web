'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, Search, ChevronDown } from 'lucide-react';
import type { Category } from '@/types/category';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { SearchDialog } from './SearchDialog';
import { ThemeToggle } from './ThemeToggle';
import { WishNav } from './WishNav';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface HeaderProps {
  categories: Category[];
}

export function Header({ categories }: HeaderProps) {
  const pathname = usePathname();
  const { t, navLabel, locale } = useDictionary();
  // Aktiflik kontrolü için dil öneği çıkarılmış yol.
  const path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
  const isHome = path === '/';
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  // Mega menü: tetikleyici ile panel arasındaki geçişte kaybolmasın diye
  // kapanış gecikmeli yapılır (hover-intent).
  const openMega = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setMegaOpen(true);
  }, []);

  const scheduleCloseMega = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setMegaOpen(false);
      closeTimer.current = null;
    }, 220);
  }, []);

  useEffect(() => {
    let ticking = false;
    // Scroll olayı rAF ile tek çerçeveye indirgenir (layout thrash'i önler).
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      setScrolled(y > 12);
      const doc = document.documentElement;
      const span = doc.scrollHeight - doc.clientHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, y / span)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Rota değişince mega menüyü kapat.
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMegaOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  // Ana sayfada hero koyu; üstte beyaz yazı, scroll sonrası koyu.
  const onDark = isHome && !scrolled && !megaOpen;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[80] transition-[background-color,border-color,backdrop-filter] duration-300 ease-[var(--ease-out-expo)]',
          scrolled || megaOpen
            ? 'border-b border-border bg-background/95 lg:bg-background/80 lg:backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
        style={{ height: 'var(--header-height)' }}
        onMouseLeave={scheduleCloseMega}
      >
        <div className="container-x flex h-full items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          <Link
            href="/"
            className="min-w-0 flex-1 truncate text-[0.7rem] font-semibold tracking-[0.06em] uppercase sm:flex-none sm:text-[0.9rem] sm:tracking-[0.14em]"
            aria-label={`${siteConfig.name} ana sayfa`}
          >
            <span className={cn('block truncate transition-colors', onDark ? 'text-white' : 'text-foreground')}>
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex xl:gap-8" aria-label={t('nav.products')}>
            {siteConfig.nav.map((item) => {
              const isProducts = item.key === 'products';
              const active = path.startsWith(item.href);
              const linkClass = cn(
                'link-underline text-sm font-medium tracking-tight transition-colors',
                onDark ? 'text-white/90 hover:text-white' : 'text-muted-strong hover:text-foreground',
                active && (onDark ? 'text-white' : 'text-foreground'),
              );

              return isProducts ? (
                <div
                  key={item.key}
                  onMouseEnter={openMega}
                  onMouseLeave={scheduleCloseMega}
                  onFocus={openMega}
                  onBlur={scheduleCloseMega}
                >
                  {/* Tıklayınca /urunler sayfasına gider; hover menüyü açar. */}
                  <Link
                    href={item.href}
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                    aria-haspopup="true"
                    className={cn(linkClass, 'flex items-center gap-1', megaOpen && (onDark ? 'text-white' : 'text-foreground'))}
                  >
                    {navLabel(item.key)}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', megaOpen && 'rotate-180')} />
                  </Link>
                </div>
              ) : (
                <Link key={item.key} href={item.href} className={linkClass}>
                  {navLabel(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-none items-center gap-1.5 sm:gap-2">
            <ThemeToggle onDark={onDark} />
            <WishNav onDark={onDark} />
            <LocaleSwitcher onDark={onDark} />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t('nav.search')}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                onDark ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-surface-2',
              )}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <MagneticButton className="hidden sm:inline-block">
              <Link
                href="/teklif-al"
                className={cn(
                  'inline-flex h-11 items-center rounded-full px-5 text-sm font-medium transition-colors',
                  onDark ? 'bg-white text-foreground hover:bg-white/90' : 'bg-foreground text-background hover:opacity-90',
                )}
              >
                {t('nav.quote')}
              </Link>
            </MagneticButton>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.menu')}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full xl:hidden',
                onDark ? 'text-white' : 'text-foreground',
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        <span
          ref={progressRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-foreground/40"
          style={{ transform: 'scaleX(0)' }}
        />

        <MegaMenu
          categories={categories}
          open={megaOpen}
          onClose={() => setMegaOpen(false)}
          onPointerEnter={openMega}
          onPointerLeave={scheduleCloseMega}
        />
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
