'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  LayoutGrid,
  Handshake,
  Megaphone,
  BookOpen,
  FileText,
  Inbox,
  Images,
  Users,
  Settings,
  History,
  ExternalLink,
  Menu,
  X,
  Info,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { signOut } from '@/app/admin/actions';
import { siteConfig } from '@/config/site';

const items = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard, exact: true },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { href: '/admin/vitrin', label: 'Malzeme Vitrini', icon: LayoutGrid },
  { href: '/admin/bayilikler', label: 'Bayilikler', icon: Handshake },
  { href: '/admin/kampanyalar', label: 'Kampanyalar', icon: Megaphone },
  { href: '/admin/kataloglar', label: 'Kataloglar', icon: BookOpen },
  { href: '/admin/icerik', label: 'İçerik', icon: FileText },
  { href: '/admin/hakkimizda', label: 'Hakkımızda', icon: Info },
  { href: '/admin/ceviri', label: 'Toplu Çeviri', icon: Languages },
  { href: '/admin/teklifler', label: 'Teklifler', icon: Inbox },
  { href: '/admin/medya', label: 'Medya', icon: Images },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users, ownerOnly: true },
  { href: '/admin/ayarlar', label: 'Ayarlar', icon: Settings, ownerOnly: true },
  { href: '/admin/aktivite', label: 'Aktivite', icon: History },
];

function NavList({ onNavigate, role }: { onNavigate?: () => void; role: string }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.ownerOnly || role === 'owner');
  return (
    <nav className="flex flex-col gap-1" aria-label="Yönetim menüsü">
      {visible.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-foreground text-background' : 'text-muted-strong hover:bg-surface-2 hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-strong transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
        Siteyi Aç
      </Link>
    </nav>
  );
}

function UserBox({ username, role }: { username: string; role: string }) {
  return (
    <div className="mt-8 border-t border-border pt-5 text-xs text-muted">
      <p className="truncate">{username}</p>
      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted">{role}</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link href="/admin/hesap" className="text-sm font-medium text-muted-strong hover:text-foreground">
          Hesabım
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm font-medium text-muted-strong hover:text-foreground">
            Çıkış Yap
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({
  username,
  role,
  children,
}: {
  username: string;
  role: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background">
      {/* Mobil üst bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-5 pb-3 pt-[calc(var(--safe-top)+0.75rem)] backdrop-blur lg:hidden">
        <Link href="/admin" className="text-[0.8rem] font-semibold tracking-[0.1em] uppercase">
          {siteConfig.legalName}
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menüyü aç"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobil çekmece */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-xs overflow-y-auto bg-background px-5 pt-5 pb-[calc(var(--safe-bottom)+1.25rem)]">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold tracking-[0.12em] uppercase">Menü</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Menüyü kapat"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} role={role} />
            <UserBox username={username} role={role} />
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link href="/admin" className="text-[0.8rem] font-semibold tracking-[0.1em] uppercase leading-tight">
              {siteConfig.legalName}
            </Link>
            <ThemeToggle />
          </div>
          <NavList role={role} />
          <UserBox username={username} role={role} />
        </aside>

        <main className="min-w-0 pb-[calc(4rem+var(--safe-bottom))]">{children}</main>
      </div>
    </div>
  );
}
