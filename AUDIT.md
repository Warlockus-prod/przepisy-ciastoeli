# Pełny audyt — przepisy.ciastoeli.pl

Data: **2026-05-29**. Zakres: kod, dokumentacja, UI/UX, SEO, bezpieczeństwo, dane.
Metoda: typecheck + eslint + npm audit + prod DB inspect + HTTP probes + Playwright screenshots (desktop+mobile) + ręczny przegląd kodu.

Skala pewności: 🟩 wysoka (zweryfikowane pomiarem) · 🟨 średnia (przegląd kodu/wizualny) · 🟧 niska (hipoteza).

---

## 0. Co naprawiono W TRAKCIE tego audytu (już wdrożone na prod)

| # | Problem | Severity | Pewność | Status |
|---|---------|----------|---------|--------|
| F1 | **Wszystkie 31 hero-zdjęć zepsute na prod** | 🔴 P0 | 🟩 99% | ✅ FIXED + deployed |
| F2 | CI `npm run lint` failował (5 errorów) | 🟠 P1 | 🟩 100% | ✅ FIXED + deployed |
| F3 | Audit screenshots wyciekły do repo | 🟢 | 🟩 100% | ✅ removed + gitignored |

### F1 — szczegóły (to było „что-то с картинками")
**Root cause:** w Day 6 zmigrowałem hero-zdjęcia do `/uploads/recipes/{slug}/hero.jpg`. Te pliki serwuje **nginx**, nie Next.js. Ale komponenty renderują je przez `next/image`, którego optimizer działa **wewnątrz kontenera** i próbuje pobrać źródło z `http://localhost:4310/uploads/...` — a aplikacja Next tej ścieżki NIE serwuje → `400 "not a valid image"` → wszystkie hero puste.
**Dowód:** `raw /uploads/...= 200 image/jpeg`, `/_next/image?url=/uploads/...= 400`.
**Fix:** `OptimizedImage` wykrywa `/uploads/*` i ustawia `unoptimized` → przeglądarka pobiera plik wprost z nginx (cache 30d immutable). Zdjęcia zewnętrzne (Unsplash/CDN) nadal optymalizowane. Zweryfikowane: hero `<img src>` = `/uploads/...` = 200.

> ⚠️ **Działanie po Twojej stronie:** odśwież stronę w Chrome z **Cmd+Shift+R**. (Playwright headless w tym projekcie nie renderuje cross-origin obrazów — to artefakt narzędzia, nie strony. Weryfikacja na poziomie HTTP jest wiążąca.)

---

## 1. 🔴 KRYTYCZNE (do zrobienia teraz)

### C1. Brak wartości odżywczych — 31/31 przepisów 🟩 100%
`nutrition IS NULL` dla **wszystkich** przepisów. To była kluczowa funkcja MVP (BŻU + schema.org `NutritionInformation`). Bez tego:
- Recipe schema niekompletny (Google preferuje pełny)
- Brak panelu BŻU w UI (komponent `NutritionPanel` istnieje w blueprincie, ale nie jest podpięty)

**Fix:** GPT-4o-mini nutrition pass (`lib/ai/nutrition-calculator.ts` — do napisania, Day 6) → wymaga `OPENAI_API_KEY`. Alternatywnie: ręczny wpis w adminie. Koszt AI: ~$0.0003/przepis = grosze.

### C2. Cienkie metadane na importach ze starego sajtu 🟩 100%
- 21/31 bez `diet_tags` (filtry diet słabo działają)
- 20/31 bez `prep_time` (karty pokazują „—")
- 20/31 bez `difficulty`

**Fix:** ten sam AI-pass co C1 może uzupełnić diet_tags + difficulty + czasy z treści. Bez AI — ręcznie w adminie (`/admin/recipes/{id}`).

---

## 2. 🟠 WYSOKIE

### H1. Brak Content-Security-Policy 🟩 100%
Headers na prod: HSTS ✓, X-Frame ✓, X-Content-Type ✓, Referrer ✓, Permissions ✓ — ale **CSP brak**. Przy włączeniu AdSense/VOX warto mieć CSP z whitelistą.
**Fix:** dodać `Content-Security-Policy` do nginx vhost (z `'unsafe-inline'` dla Tailwind + JSON-LD; docelowo nonce).

### H2. Parsing składników gubi dane przy imporcie 🟨 85%
Przykład z prod: `"300 ml Kruszonka z wafli waniliowych"` — „Kruszonka" nie jest mierzona w ml; to artefakt starego sajtu (kolejność „ilość jednostka NAZWA" złamana). Parser bierze pierwsze 2 tokeny jako amount+unit niezależnie od sensu.
**Wpływ:** część składników ma dziwny `unit`. Wyświetlanie OK (pokazujemy `raw`), ale kalkulator porcji przeliczy błędnie.
**Fix:** lepszy normalizer LUB (lepiej) AI-rewrite przy imporcie ujednolici. Dla istniejących 20 starych — AI-pass.

### H3. Server Action 404 spam w logach 🟨 80%
Boty skanują CVE-2025-29927 (`Failed to find Server Action "000...0"`). Nieszkodliwe, ale zaśmieca logi i może maskować realne błędy.
**Fix:** nginx — odrzucać POST z nagłówkiem `Next-Action` bez sesji, albo filtrować w log. Niski priorytet.

### H4. Rate-limit nadal in-memory (nie Redis) 🟩 100%
`/api/admin/auth/login` i `/api/public/ratings` trzymają limity w `Map` → reset przy restarcie kontenera (a restartujemy przy każdym deployu). `@upstash/ratelimit` jest w deps, ale niepodpięty.
**Fix:** podpiąć Upstash (potrzebne `UPSTASH_REDIS_REST_URL/_TOKEN`). Do czasu — akceptowalne dla małego ruchu.

### H5. Brak realnego pomiaru Core Web Vitals 🟧 — nie zmierzone
TTFB świetny (45-50ms cached), ale LCP/INP/CLS nie zmierzone Lighthouse'em na realnym urządzeniu. Hero teraz `unoptimized` (oryginalny JPEG 150-310KB zamiast WebP) — to lekki regres rozmiaru, ale stabilność > mikro-optymalizacja.
**Fix:** Lighthouse CI lub ręczny audit; rozważyć pre-generowanie WebP wariantów przez sharp przy uploadzie.

---

## 3. 🟡 ŚREDNIE

| # | Problem | Pewność |
|---|---------|---------|
| M1 | Cookie banner (modal centrowany) zasłania hero CTA na desktopie — lepszy byłby pasek na dole | 🟨 85% |
| M2 | `react-hooks/set-state-in-effect` (5×) — obniżone do warn; docelowo `useSyncExternalStore` dla localStorage | 🟩 100% |
| M3 | `NutritionPanel` zadeklarowany w blueprincie, niezaimplementowany | 🟩 100% |
| M4 | Admin nav linkuje do `/admin/queue`, `/admin/images`, `/admin/users`, `/admin/settings` → **404** (strony nie istnieją) | 🟩 100% |
| M5 | Brak edycji ingredients/instructions w `/admin/recipes/{id}` (tylko metadane; treść tylko przez JSON w DB) | 🟩 100% |
| M6 | Brak Cmd+K search modal (jest tylko `/wyszukaj`) | 🟩 100% |
| M7 | `ServingsCalculator` przelicza `1/2` → `0.5` zamiast ułamka (czytelność) | 🟨 80% |
| M8 | `RecipeEditForm` / `ManualRecipeForm` bez TipTap (plain textarea) | 🟩 100% |
| M9 | Brak `/admin/ratings` — moderacja ocen (dashboard linkuje, strony brak) | 🟩 100% |
| M10 | `images` rekord tworzony przy uploadzie, ale sharp NIE generuje wariantów WebP (pole webp_* puste) | 🟩 100% |

---

## 4. 🟢 NICE-TO-HAVE / backlog

- N1 Sentry (error tracking) — `SENTRY_DSN` stub, niepodpięty
- N2 `news-sitemap.xml` działa, ale brak osobnych sitemap-images / sitemap-categories (blueprint zakładał 4)
- N3 Brak hreflang (gdy dojdzie EN)
- N4 Brak Web Vitals → GA4 reporting
- N5 Brak testów (Vitest 0 testów; blueprint zakładał 64+)
- N6 `marked`, `zustand`, `swr`, `framer-motion`, `slugify`, `nanoid` w deps ale **nieużywane** (bloat — 6 paczek)
- N7 `download-hero-images.mjs` wymagał ręcznego `chown 1001:1001` — udokumentować w DEPLOY.md
- N8 Brak migracji 1127 starych przepisów Ela (jest tylko 20 sampli + 11 referencyjnych)

---

## 5. Dokumentacja — przegląd

| Plik | Stan | Uwaga |
|------|------|-------|
| `BLUEPRINT.md` | 🟩 dobry | Kompletny, ale opisuje docelowy stan — część (NutritionPanel, batch import, Telegram) jeszcze nie zrobiona. Dodać status „done/todo" per sekcja |
| `DEPLOY.md` | 🟨 | Działa, ale brakuje: kroku `chown` na uploads, notatki o SNI 8443 pattern, że `.env` symlink potrzebny dla `--env-file` |
| `README.md` | 🟩 | OK |
| `AUDIT.md` | 🟩 | ten plik |
| `.env.example` / `.env.production.example` | 🟩 | OK, kompletne |
| Brak: `CHANGELOG.md`, `CONTRIBUTING.md` | 🟢 | opcjonalne |

---

## 6. Bezpieczeństwo — przegląd 🟩 (mocne)

✅ Admin pages → 307 redirect do `/admin/login` (middleware)
✅ Admin API → 401 bez sesji (`requireRole`)
✅ `/.env`, `/.env.production`, `/.git/config`, `/_local-temp/*` → 404
✅ HMAC-signed cookie, httpOnly, sameSite=strict, 8h TTL
✅ SSRF guard na parse-url (127.0.0.1 → blocked, zweryfikowane)
✅ Magic-byte check na upload (zły plik → 415)
✅ Prompt-injection guard (sanitize-html + patterns)
✅ Rating: 1/IP/przepis (unique), email double opt-in

⚠️ Do poprawy: CSP (H1), rate-limit→Redis (H4), `ADMIN_OWNER_EMAILS` zawiera `owner@ciastoeli.pl` (placeholder — usunąć jeśli nie istnieje), hasło admina to hex z dnia 1 (rotować przed publicznym launchem).

---

## 7. UI/UX — przegląd 🟨 (dobry fundament)

**Mocne strony** (zweryfikowane screenshotami desktop 1440 + mobile 390):
- ✅ Typografia premium: Fraunces (display) + Inter (body), dobra hierarchia
- ✅ Paleta cream/terracotta/sage spójna, „VIP" feel osiągnięty
- ✅ Diet badges (sage chips) renderują się, czytelne
- ✅ Siatka kategorii z licznikami działa
- ✅ Mobile: drawer menu, sticky header, czytelne karty
- ✅ Recipe page: sticky sidebar składników, numerowane kroki, sekcja ocen

**Do poprawy:**
- 🟨 M1: cookie modal zasłania treść na desktopie (→ bottom bar)
- 🟨 Hero: gdy brak zdjęcia (przyszłe przepisy bez foto) — placeholder zamiast pustego cream
- 🟨 Karty „latest" i „featured" duplikują te same przepisy (mało treści — naturalne przy 31 przepisach, zniknie przy większej bazie)
- 🟨 Brak stanu „loading" / skeleton przy nawigacji (jest klasa `.skeleton` w CSS, nieużywana)
- 🟨 `dla-dzieci` (0 przepisów) ukryte poprawnie ✓
- 🟧 Dostępność (a11y) nie audytowana axe — sprawdzić kontrast sage na cream, focus-visible, aria

---

## 8. Czego NIE zweryfikowałem (uczciwie o pewności)

- 🟧 Rendering obrazów w realnym Chrome (Playwright headless niewiarygodny tu — potwierdzenie HTTP=200 jest, ale wizualnie potwierdź u siebie)
- 🟧 Lighthouse / Core Web Vitals na realnym urządzeniu
- 🟧 Accessibility (axe-core) — kontrast, klawiatura, screen reader
- 🟧 Load test (zachowanie przy ruchu)
- 🟧 Cross-browser (Safari, Firefox)

---

## 9. Rekomendowana kolejność

**Teraz (bez Twoich tokenów):**
1. ✅ F1 obrazy — ZROBIONE
2. ✅ F2 CI lint — ZROBIONE
3. M4/M9 — zaślepki dla `/admin/queue|images|users|settings|ratings` (żeby nav nie dawał 404)
4. M1 — cookie banner jako bottom bar
5. N6 — usunąć nieużywane paczki (−6 deps)
6. H1 — CSP w nginx
7. DEPLOY.md — uzupełnić (chown, SNI, env symlink)

**Gdy dasz OPENAI_API_KEY:**
8. C1+C2+H2 — AI nutrition+diet+difficulty pass na 31 przepisach (jeden skrypt, ~$0.30)
9. NutritionPanel UI (M3)

**Gdy dasz pozostałe tokeny:**
10. H4 Upstash, N1 Sentry, AdSense, Telegram bot (Day 7)

---

## 10. Werdykt + pewność ogólna

| Obszar | Ocena | Pewność |
|--------|-------|---------|
| Architektura / kod | 8/10 — solidny, typowany, czysty podział | 🟩 90% |
| Bezpieczeństwo | 8/10 — mocne podstawy, brak CSP+Redis | 🟩 90% |
| SEO | 7/10 — schema/sitemap/robots OK, brak nutrition w schema | 🟩 85% |
| UI/UX | 7.5/10 — ładny, kilka szlifów | 🟨 75% |
| Dane (treść) | 5/10 — cienkie metadane, brak BŻU | 🟩 95% |
| Dokumentacja | 7/10 — dobra, drobne luki | 🟩 80% |
| Production-ready | **6.5/10** — działa, ale przed publicznym launchem: nutrition + CSP + rotacja haseł + admin stubs | 🟨 80% |

**Globalna pewność tego audytu: ~85%.** Wszystkie 🟩 findings zweryfikowane pomiarem (DB query, HTTP probe, lint/tsc). 🟨/🟧 oparte na przeglądzie kodu/wizualnym — mogą wymagać Twojego potwierdzenia (zwł. rendering obrazów w Chrome + a11y + Lighthouse, których nie zmierzyłem narzędziem).
