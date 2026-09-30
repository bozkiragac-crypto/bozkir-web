import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Ek medya host'ları env'den (virgülle ayrılmış): "cdn.example.com,assets.example.com" */
const extraHosts = (process.env.NEXT_PUBLIC_MEDIA_HOSTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Node-only paketler edge/middleware bundle'ına girmesin.
  serverExternalPackages: ['pg', 'bcryptjs', 'sharp'],
  // Kökte ikinci bir lockfile olduğu için workspace kökünü sabitler.
  outputFileTracingRoot: __dirname,
  images: {
    formats: ['image/avif', 'image/webp'],
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
        ],
      },
    ];
  },
};

export default nextConfig;
