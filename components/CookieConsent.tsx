'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cc_consent_v1';
const CONSENT_VERSION = 1;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentState = {
  version: number;
  necessary: true;       // always true
  functional: boolean;
  analytics: boolean;
  ads: boolean;
  expires_at: number;
  set_at: number;
};

function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION || parsed.expires_at < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(c: Omit<ConsentState, 'version' | 'expires_at' | 'set_at' | 'necessary'>) {
  const now = Date.now();
  const state: ConsentState = {
    version: CONSENT_VERSION,
    necessary: true,
    set_at: now,
    expires_at: now + ONE_YEAR_MS,
    ...c,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('cc:consent-change', { detail: state }));
}

export function hasConsent(category: 'functional' | 'analytics' | 'ads'): boolean {
  if (typeof window === 'undefined') return false;
  const c = readConsent();
  return c?.[category] === true;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [prefs, setPrefs] = useState({ functional: true, analytics: true, ads: true });

  useEffect(() => {
    if (!readConsent()) setShow(true);
  }, []);

  const acceptAll = () => {
    writeConsent({ functional: true, analytics: true, ads: true });
    setShow(false);
  };
  const rejectAll = () => {
    writeConsent({ functional: false, analytics: false, ads: false });
    setShow(false);
  };
  const saveCustom = () => {
    writeConsent(prefs);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div role="dialog" aria-label="Zgoda na cookies" className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-line bg-surface shadow-[var(--shadow-hero)]">
        <div className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Cookies & prywatność</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Używamy cookies do działania portalu, statystyk (Google Analytics) oraz reklamy (AdSense, VOX SSP).
            Możesz zaakceptować wszystkie lub dostosować preferencje. Więcej w{' '}
            <Link href="/cookies" className="text-terracotta underline">polityce cookies</Link>.
          </p>

          {customize && (
            <div className="mt-4 space-y-3 rounded-md bg-cream-deep p-4">
              <CheckRow
                label="Niezbędne"
                desc="Sesja, bezpieczeństwo. Zawsze włączone."
                checked
                disabled
              />
              <CheckRow
                label="Funkcjonalne"
                desc="Zapisane preferencje (porcje, motyw)."
                checked={prefs.functional}
                onChange={(v) => setPrefs({ ...prefs, functional: v })}
              />
              <CheckRow
                label="Analityka"
                desc="Google Analytics, Web Vitals."
                checked={prefs.analytics}
                onChange={(v) => setPrefs({ ...prefs, analytics: v })}
              />
              <CheckRow
                label="Reklamy"
                desc="AdSense, VOX SSP. Personalizacja po zgodzie."
                checked={prefs.ads}
                onChange={(v) => setPrefs({ ...prefs, ads: v })}
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {customize ? (
              <>
                <button
                  onClick={saveCustom}
                  className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
                >
                  Zapisz preferencje
                </button>
                <button
                  onClick={() => setCustomize(false)}
                  className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta"
                >
                  Anuluj
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={acceptAll}
                  className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
                >
                  Akceptuję wszystkie
                </button>
                <button
                  onClick={rejectAll}
                  className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta"
                >
                  Odrzuć opcjonalne
                </button>
                <button
                  onClick={() => setCustomize(true)}
                  className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta"
                >
                  Dostosuj
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 accent-terracotta"
      />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-muted">{desc}</p>
      </div>
    </label>
  );
}
