# Tech audit — przepisy.ciastoeli.pl

Date: **2026-05-08**, after Day 1–4 + initial deploy.

## TL;DR

**Server is fast** (TTFB 67–153ms на prod, CPU 0.02%, RAM 609MB). Реальное "подвисание" приходит от **frontend-rendering**: 3840w hero photo, отключенный ISR cache, hydration React-19, лazy-fetch external CDN'ов. Главный quick-win — включить ISR (5 минут работы → -70% повторных DB hits).

| Категория | Severity | Counted |
|---|---|---|
| 🔴 Critical | сейчас ломает / прямой урон | **3** |
| 🟠 High | боль/упускаем выгоду | **8** |
| 🟡 Medium | улучшения | **12** |
| 🟢 Nice-to-have | потом | **10** |

---

## 🔴 CRITICAL (фиксить сразу)

### C1. ISR caching полностью выключен — каждый запрос hit'ит DB

**Cause:** в Day 4 добавил `export const dynamic = 'force-dynamic'` на:
- `app/(site)/page.tsx`
- `app/(site)/przepisy/page.tsx`
- `app/sitemap.ts`

Это снимает ISR. Каждый GET → 3 DB queries для главной + рендер. На trafic'е сразу пузырь.

Headers сейчас:
```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
```

**Fix:** убрать `dynamic = 'force-dynamic'`, оставить только `revalidate = X` (ISR), а build делать с PG доступным ИЛИ обернуть DB calls в try/catch с пустым fallback (уже сделано для sitemap).

```ts
// удалить:
export const dynamic = 'force-dynamic';
// оставить:
export const revalidate = 300;
```

Plus: build через docker compose должен поднять postgres в той же сети + pass `DATABASE_URL` в build time. Альтернатива — обернуть `Promise.all([...])` в `try { ... } catch { return [[],[],[]]; }`.

### C2. Server Action error spam в логах

Logs полны: `Error: Failed to find Server Action "00...00". This request might be from an older or newer deployment.`

Скорее всего это **боты сканируют CVE-2025-29927** (Next.js authorization bypass). Не вредно но захламляет, может маскировать реальные ошибки.

**Fix:**
1. Add nginx rule: drop POST на `/` и unknown paths без CSRF cookies
2. Or: filter logs на nginx уровне
3. Или просто игнорить — не критично

### C3. Hero image src использует 3840w (~600KB-2MB первого LCP)

В rendered HTML:
```html
<img src="/_next/image?url=...&w=3840&q=75" />
```

Next/Image при `priority` + `fill` без `sizes` corretly выставляет `sizes` но `src` всё равно тащит самый большой. Реально нужен максимум 1200w.

**Fix:** в `RecipeHero` поставить `quality={80}` и убедиться что Unsplash URL не имеет `w=1200` baked в (двойной resize → плохое качество). Set `sizes="(min-width: 1024px) 600px, 100vw"` правильно — уже стоит.

Дополнительно: уменьшить `images.deviceSizes` в next.config.ts чтобы 3840w не генерировался.

---

## 🟠 HIGH

### H1. Дублирование security headers

`next.config.ts` и nginx vhost оба ставят:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Response показывает их в дубль (`X-Content-Type-Options: nosniff, nosniff`).

**Fix:** убрать `headers()` из `next.config.ts`, оставить в nginx (он ближе к юзеру).

### H2. Отсутствует Content-Security-Policy

Нет CSP вообще. Inline scripts (JSON-LD, Tailwind), inline styles, image hosts — всё открыто.

**Fix:** добавить в nginx:
```
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' pagead2.googlesyndication.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;
```
(Но через `'unsafe-inline'` — Tailwind нужен. Для строгого CSP → nonce-инжект, но это бόльшая работа.)

### H3. External image CDN dependency = LCP риск

26 из 31 рецептов используют `cdn.aniagotuje.com` / `kwestiasmaku.com` / `unsplash.com` для hero. Если эти CDN'ы тормозят / падают — наша страница ломается.

**Fix (Day 6 в blueprint):** download pipeline → /opt/repos/przepisy/uploads/recipes/{slug}/hero.webp при импорте → переписывать DB row на наш URL. nginx уже отдаёт /uploads/ с `expires 30d`.

### H4. Нет /o-nas, /polityka-redakcyjna, /kontakt — критично для E-E-A-T

Footer ссылки → 404. Google News не примет без editorial pages.

**Fix:** статичные страницы на 30 минут работы. Контент уже в `BLUEPRINT.md` (про авторов).

### H5. listCategoriesWithCounts crashed silently in build

Я переписал на 2 запроса + JS aggregate (✓ работает). Но root cause — drizzle SQL subselect template — не ясен. Нужно проверить если ещё где-то такая же ловушка.

**Fix:** grep по проекту: `sql\`COALESCE\((SELECT.*\)\)` — проверить все subselect'ы. Прямой вызов через psql работал, через Next standalone — нет. Возможно minifier ломал backtick template.

### H6. /search (wyszukaj) не индексируется (но не блокируется robots)

`metadata.robots = { index: false }` правильно. Но `/wyszukaj` есть в `Disallow:` robots.txt. Hmm, зачем оба. Достаточно robots meta.

**Fix:** убрать из `app/robots.ts` `Disallow: /wyszukaj` (мета на странице уже блокирует).

### H7. In-memory rate limiters теряются при рестарте

`/api/admin/auth/login` и `/api/public/ratings` используют `Map` как rate-limit. Container restart → лимиты сбрасываются.

**Fix:** Upstash Redis (уже в deps):
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
export const authLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m') });
```

Plus env: получить free tier на upstash.com → задать `UPSTASH_REDIS_REST_URL`/`_TOKEN`.

### H8. Нет backups для PG / uploads

Если volume `pgdata` повредится — данные потеряны.

**Fix:** cron на VPS:
```cron
0 3 * * * docker exec przepisy-postgres pg_dump -U przepisy przepisy | gzip > /root/backups/przepisy-$(date +\%F).sql.gz
```
Plus rsync в отдельный VPS / S3 раз в неделю.

---

## 🟡 MEDIUM

### M1. Дубль `CATEGORY_LABELS` в 3 файлах

`RecipeCard.tsx`, `RecipeHero.tsx`, `przepisy/[slug]/page.tsx` имеют свои копии map'ы category → польская label.

**Fix:** `lib/labels.ts` с экспортом + `categories` table уже имеет `name_pl` — лучше тянуть из БД через query.

### M2. Дубль `CUISINE_LABELS` в `RecipeHero.tsx`

То же самое для кухни. Тянуть из `cuisines` table.

### M3. `lib/seo/recipe-jsonld.ts` имеет dead code

`_unused_keep_types(_r?: RecipeRating)` — хак для типов. Удалить.

### M4. RecipeListItem.rating_avg тип `int * 10` фрагилен

Хранится как `45` для 4.5★. Бизнес-логика "разделить на 10" разбросана. Frontend несколько раз пишет `(avg / 10).toFixed(1)`.

**Fix:** хранить как `decimal(2,1)` или вычислять через VIEW. Или утилка `formatRating(rating_avg)` (уже есть в format.ts — использовать единообразно).

### M5. `app/(site)/page.tsx` имеет inline `Section` компонент

Скопирован в нескольких страницах. Вынести в `components/Section.tsx`.

### M6. `RecipeCard` не показывает diet badges

Карточка имеет место для diet-чипов (vegan, GF) но их нет. UX: вижу преимущества рецепта в ленте.

### M7. Mobile menu отсутствует

`Header` показывает nav только на `md+`. На mobile — только лого + поиск-иконка. Нет drawer'а с категориями.

**Fix:** `components/layout/MobileMenu.tsx` — Sheet (shadcn) или собственный simple drawer.

### M8. ServingsCalculator не учитывает дробные ингредиенты в формате "1/2"

`raw: "1/2 łyżeczki cukru"` парсится как `amount: 0.5`. OK при insert. Но при перерасчёте `1/2 × 8/4 = 1` — корректно. Но рендер показывает `0.5` а не `1/2` — менее читаемо.

**Fix:** улучшить formatter — конвертировать обратно в дроби для распространенных значений.

### M9. Recipe edit form — нет TipTap для rich-text

`notes`, `description` — plain textarea. Для контента это нормально на старте, но желательно WYSIWYG для bold/italic/lists.

**Fix:** Day 4-5 backlog: добавить TipTap.

### M10. Нет редактора ingredients/instructions в admin/edit

`/admin/recipes/[id]` правит metadata но не сами ингредиенты/шаги. Они только через JSON в БД.

**Fix:** добавить специализированные редакторы — Sortable list для steps, structured form для ingredients.

### M11. Sitemap не использует ISR

`export const dynamic = 'force-dynamic'` тоже стоит на sitemap (моя ошибка). Нагружает DB на каждый Googlebot crawl.

**Fix:** убрать force-dynamic, оставить `revalidate = 3600`. safeQuery обёртка справится при build-time.

### M12. Нет news-sitemap.xml

Per blueprint требование Google News — отдельный sitemap для свежих ≤48h рецептов.

**Fix:** `app/news-sitemap.xml/route.ts` — custom XML output.

---

## 🟢 NICE-TO-HAVE

### N1. Нет Sentry / error tracking
### N2. Нет CI (GitHub Actions: typecheck + lint + build)
### N3. Нет healthcheck endpoint для admin (отдельно)
### N4. Нет /lista-zakupow (shopping list page) — компонент `RecipeActions` ничего не делает с saved
### N5. Нет /ulubione (favorites page) — то же самое
### N6. /drukuj/[slug] (print-only page) отсутствует
### N7. Нет sitemap-index (один большой sitemap.xml — для масштаба >50k URL разбить)
### N8. Нет hreflang (готово к мультиязычности?)
### N9. WebVitals не трекается (в blueprint планировалось → GA4)
### N10. Нет admin/queue, admin/images, admin/users страниц (есть в sidebar nav, но 404)

---

## 🔥 Quick wins (за 30 минут)

В порядке impact:

1. **Убрать `dynamic = 'force-dynamic'`** с home + przepisy + sitemap → ISR работает → 70% requests из cache (C1, M11)
2. **Удалить duplicate headers из next.config.ts** — fix вёрстки/security audit (H1)
3. **Создать /o-nas, /polityka-redakcyjna, /kontakt** — статичные с контентом (H4)
4. **Убрать `_unused_keep_types`** из recipe-jsonld.ts (M3)
5. **Экстрагировать CATEGORY_LABELS / CUISINE_LABELS в lib/labels.ts** (M1, M2)
6. **Reduce next.config.ts deviceSizes** — убрать 3840 (C3)
7. **Add CSP в nginx vhost** (H2)
8. **Убрать `Disallow: /wyszukaj`** из robots.ts (H6)

---

## 📋 Ранжированный roadmap

### Sprint A (1 день) — Performance + Quality
- C1, C3, H1, H2, M1, M2, M3, M5, M11

### Sprint B (2 дня) — UX + SEO
- H4, H6, M6, M7, M12, N4, N5, N6, N8

### Sprint C (3 дня) — Production hardening
- H7 (Upstash), H8 (backups), N1 (Sentry), N2 (CI), N9 (WebVitals)

### Sprint D (5+ дней) — Blueprint Day 5–10
- AI URL parsing pipeline (Day 5)
- AI photo vision flow (Day 6)
- Self-hosted images pipeline (H3)
- Telegram bot (Day 7)
- Batch import (Day 8)
- AdSense (Day 9)
- Local image migration

---

## 🩺 Про "подвисание"

Прямого backend-bottleneck **нет** — TTFB 67–153ms. Но реальное ощущение торможения у юзера:

| Симптом | Причина | Fix |
|---|---|---|
| First load slow | Hero 3840w image (~1MB) | C3: cap deviceSizes |
| Repeat load slow | ISR off — каждый раз DB | C1: revalidate |
| Image flicker | External CDN latency | H3: self-host |
| Hydration jank | React 19 streaming | минор, оптимизировать клиентские |

После Sprint A повторные загрузки будут <50ms (cache hits), первая загрузка <2s LCP.

---

## 📊 Метрики baseline (для сравнения)

| Endpoint | TTFB avg | Bytes |
|---|---|---|
| `/api/health` | 109ms | 0.2 KB |
| `/` | 153ms | 114 KB |
| `/przepisy` | 88ms | 151 KB |
| `/przepisy/szarlotka` | 105ms | 100 KB |
| `/kategoria/ciasta` | 67ms | 67 KB |
| `/wyszukaj?q=zurek` | 72ms | 38 KB |

**VPS:** 6.1/15 GB RAM, 24/150 GB disk free (84% used — TIGHT), CPU 0.02%.
**Image:** 447MB Docker image (можно сократить до ~250MB на alpine + sharp prebuilt).

---

## 🎯 Что предлагаю сделать прямо сейчас

**Sprint A** (1 час реально):
1. Восстановить ISR (убрать force-dynamic)
2. Удалить дубли headers
3. Создать 3 editorial страницы (o-nas, polityka, kontakt) — заглушки с реальным контентом про Ela
4. CSP в nginx
5. Cap deviceSizes
6. Чистка lib/labels.ts

После — Sprint B (2 ч): mobile menu, news-sitemap, лучшие placeholder routes.

Готов начинать Sprint A?
