import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, verifySessionToken } from '@/lib/auth/token';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';

const LOCALE_COOKIE = 'bozkir_locale';

/** `Accept-Language` başlığından en iyi eşleşen dili seçer. */
function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const header = request.headers.get('accept-language') ?? '';
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag = '', q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0) Bakım modu: public trafik bakım sayfasına yönlendirilir.
  //    Sağlık ucu, medya, statik dosyalar ve admin hariç.
  const maintenance = process.env.MAINTENANCE_MODE === '1';
  if (maintenance) {
    const excluded =
      pathname.startsWith('/api/') ||
      pathname.startsWith('/media/') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/maintenance') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.');
    if (!excluded) {
      return NextResponse.rewrite(new URL('/maintenance', request.url), { status: 503 });
    }
  }

  // 1) /admin/* koruması: imzalı oturum çerezi doğrulanır (edge'de DB sorgusu yok).
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const isLogin = pathname === '/admin/login';
    const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE)?.value);
    const authorized = !!session?.admin;

    if (!isLogin && !authorized) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isLogin && authorized) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 2) Dil yönlendirmesi: /x → /tr/x (dizinde geçerli dil yoksa).
  const first = pathname.split('/')[1];
  if (isLocale(first)) {
    // Server component'ler `getServerLocale()` ile okusun diye dil başlığa yazılır.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', first);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  const res = NextResponse.redirect(url);
  res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return res;
}

export const config = {
  matcher: ['/((?!_next|api|media|maintenance|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
