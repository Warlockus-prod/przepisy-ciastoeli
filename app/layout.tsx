import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'przepisy.ciastoeli.pl';

export const viewport: Viewport = {
  themeColor: '#FBF6EE',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Domowe wypieki, smak premium`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    'Premium polski portal kulinarny. Sprawdzone przepisy domowych wypieków, klasycznych dań i nowoczesnych deserów — z dokładnymi wskazówkami i pełnymi wartościami odżywczymi.',
  applicationName: SITE_NAME,
  keywords: ['przepisy', 'kulinarny', 'wypieki', 'ciasta', 'desery', 'obiady', 'polskie przepisy'],
  authors: [{ name: 'Ela', url: `${SITE_URL}/autor/ela` }],
  creator: 'Ela',
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Domowe wypieki, smak premium`,
    description: 'Premium polski portal kulinarny. Sprawdzone przepisy.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: 'Premium polski portal kulinarny.' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
