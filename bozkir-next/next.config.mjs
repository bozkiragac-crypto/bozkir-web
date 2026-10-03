import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Ek medya host'ları env'den (virgülle ayrılmış): "cdn.example.com,assets.example.com" */
const extraHosts = (process.env.NEXT_PUBLIC_MEDIA_HOSTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

// GA4 (googletagmanager/google-analytics) ve Google Maps iframe'lerine izin veren CSP.
// Next'in satır içi script'leri (hydration/theme) için 'unsafe-inline' gerekir.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com https://challenges.cloudflare.com",
  'frame-src https://www.google.com https://maps.google.com https://challenges.cloudflare.com',
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Node-only paketler edge/middleware bundle'ına girmesin.
  serverExternalPackages: ['pg', 'bcryptjs', 'sharp', '@aws-sdk/client-s3'],
  // Kökte ikinci bir lockfile olduğu için workspace kökünü sabitler.
  outputFileTracingRoot: __dirname,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Gerçek grid/hero genişliklerine göre daraltıldı (gereksiz varyant üretimini azaltır).
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
    // Same-origin API görselleri (örn. /api/image?id=...) sorgu dizesiyle izinli.
    localPatterns: [{ pathname: '/**' }],
    remotePatterns: [
      { protocol: 'https', hostname: 'bozkiragac.com' },
      { protocol: 'https', hostname: 'www.bozkiragac.com' },
      // Self-hosted nesne depolama (SeaweedFS/S3) — yerel geliştirme
      { protocol: 'http', hostname: 'localhost', port: '8333', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8333', pathname: '/**' },
      { protocol: 'http', hostname: 'storage', port: '8333', pathname: '/**' },
      // Ek CDN / staging host'ları (env ile)
      ...extraHosts.map((hostname) => ({ protocol: 'https', hostname })),
    ],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap', '@react-three/drei'],
    // Server Action gövde limiti: görsel/PDF yüklemeleri (varsayılan 1 MB yetmiyor).
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          // HTTPS arkasında (nginx) HSTS zaten eklenir; doğrudan Next erişiminde
          // de tarayıcıya tutarlı sinyal verilir. HTTP üzerinden UA'lar yok sayar.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

// Bundle analizi yalnızca ANALYZE=true iken yüklenir (üretim imajında devDependency yok).
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  const { default: bundleAnalyzer } = await import('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer({ enabled: true });
}

export default withBundleAnalyzer(nextConfig);
