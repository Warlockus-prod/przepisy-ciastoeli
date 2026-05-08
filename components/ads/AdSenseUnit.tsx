'use client';

import { useEffect, useRef } from 'react';

type Props = {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  layout?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSenseUnit({
  slot,
  format = 'auto',
  responsive = true,
  layout,
  style = { display: 'block', minHeight: 100 },
  className = '',
}: Props) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    if (typeof window === 'undefined') return;
    if (!window.adsbygoogle) return;

    try {
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      /* swallow — script not yet loaded */
    }
  }, [slot]);

  if (!ADSENSE_CLIENT) return null;

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className}`.trim()}
      style={style}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      data-ad-layout={layout}
    />
  );
}
