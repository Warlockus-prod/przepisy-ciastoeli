'use client';

import { useEffect, useState } from 'react';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const VOX_ENABLED = process.env.NEXT_PUBLIC_VOX_ENABLED === 'true';

function readAdsConsent(): boolean {
  try {
    const raw = localStorage.getItem('cc_consent_v1');
    if (!raw) return false;
    const c = JSON.parse(raw);
    return c?.ads === true && c?.expires_at > Date.now();
  } catch {
    return false;
  }
}

export function AdManager() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setHasConsent(readAdsConsent());
    const onChange = () => setHasConsent(readAdsConsent());
    window.addEventListener('cc:consent-change', onChange);
    return () => window.removeEventListener('cc:consent-change', onChange);
  }, []);

  useEffect(() => {
    if (!hasConsent) return;

    if (ADSENSE_CLIENT && !document.querySelector('script[data-ads-loader="adsense"]')) {
      const s = document.createElement('script');
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.dataset.adsLoader = 'adsense';
      document.head.appendChild(s);
    }

    if (VOX_ENABLED && !document.querySelector('script[data-ads-loader="vox"]')) {
      const s = document.createElement('script');
      s.src = 'https://st.hbrd.io/ssp.js';
      s.async = true;
      s.dataset.adsLoader = 'vox';
      document.head.appendChild(s);
    }
  }, [hasConsent]);

  return null;
}
