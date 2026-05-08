import type { NextConfig } from 'next';

// Security headers are set in nginx vhost (przepisy.nginx.conf), not here — avoiding duplicates.

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Cap responsive sizes — 1920 is enough for hero, 3840 was wasteful.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'ciastoeli.pl' },
      { protocol: 'https', hostname: '**.ciastoeli.pl' },
      { protocol: 'https', hostname: 'cdn.aniagotuje.com' },
      { protocol: 'https', hostname: '**.kwestiasmaku.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
      { protocol: 'https', hostname: '**.openai.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
