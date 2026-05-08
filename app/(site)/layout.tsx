import { AdManager } from '@/components/ads/AdManager';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { OrganizationStructuredData } from '@/components/StructuredData';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationStructuredData />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <AdManager />
      <CookieConsent />
    </>
  );
}
