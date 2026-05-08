import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/przepisy/', '/kategoria/', '/kuchnia/', '/dieta/', '/autor/', '/uploads/'],
        // /wyszukaj has noindex meta — don't double-block, let crawler discover via links
        disallow: ['/admin/', '/api/', '/lista-zakupow', '/ulubione', '/?utm_*'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: ['/przepisy/', '/uploads/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/uploads/', '/_next/image'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'anthropic-ai'],
        disallow: '/',
      },
      {
        userAgent: ['OAI-SearchBot', 'PerplexityBot', 'ChatGPT-User'],
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
