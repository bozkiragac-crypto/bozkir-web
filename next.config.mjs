import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Kökte ikinci bir lockfile olduğu için workspace kökünü sabitler.
  outputFileTracingRoot: __dirname,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'bozkiragac.com' },
      { protocol: 'https', hostname: 'www.bozkiragac.com' },
      // Yerel geliştirme: PHP API görselleri
      { protocol: 'http', hostname: '127.0.0.1', port: '8789', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '8789', pathname: '/**' },
    ],
    minimumCacheTTL: 300,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap', '@react-three/drei'],
  },
};

export default nextConfig;
