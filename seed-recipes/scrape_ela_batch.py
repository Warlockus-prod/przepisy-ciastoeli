#!/usr/bin/env python3
"""Scrape recipes from ciastoeli.pl and emit batch-import JSON.

Discovers URLs from post-sitemap.xml + post-sitemap2.xml, skips already-imported
slugs, scrapes schema.org Recipe JSON-LD (with HTML fallback), maps to the target
batch shape, and writes a single UTF-8 JSON array.
"""
import json
import re
import sys
import html as htmllib
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

try:
    from bs4 import BeautifulSoup
    HAVE_BS4 = True
except Exception:
    HAVE_BS4 = False

HDR = {"User-Agent": "Mozilla/5.0 (compatible; RecipeBatchBot/1.0; +recipe-import)"}
SITEMAPS = [
    "https://ciastoeli.pl/post-sitemap.xml",
    "https://ciastoeli.pl/post-sitemap2.xml",
]
TARGET_COUNT = 120
OUT_PATH = "/Users/Andrey/App/ciastoeli/seed-recipes/batch/ela-batch-1.json"

SKIP = set("""
angielski-keks banany-w-panierce boston-cream-pie-2 babeczki-piernikowe-z-kremem-serowym-o-smaku-cytrynowym
buleczki-pszenno-razowe-z-miodem-i-maslanka chutney-morelowe-z-rodzynkami-i-porzeczkami
ciasto-z-swiezymi-truskawkami-2 consomme-z-arbuza kompota-z-winogron-jagod-i-moreli
kremy-z-opalonych-agrestow kurczak-z-mango muffiny-z-miodem-marchewka-i-daktylami
nowojorski-sernik-1 przepis-na-syrop-z-czerwonej-papryki-do-nalesnikow
pudding-z-mchu-karagenowego-z-rozgniecionymi-jagodami salatka-z-zielonej-fasoli-i-pomidorkow-koktajlowych
sernik-z-agrestem slodka-focaccia-z-winogronami-i-orzechami-wloskimi swieza-galaretka-z-ziolami
swieze-smardze-z-jablkami-i-makaronem-z-maslem szybkie-ciasto-na-pizze-i-sos
""".split())

ALLOWED_CATS = {"ciasta","desery","obiady","zupy","salatki","sniadania","przekaski","napoje","przetwory","dla-dzieci"}


# ---------- helpers ----------

def get(url, timeout=30):
    return requests.get(url, headers=HDR, timeout=timeout)


def slug_of(url):
    """Last path segment of the URL (the recipe slug)."""
    path = url.replace("https://ciastoeli.pl/", "").replace("http://ciastoeli.pl/", "").rstrip("/")
    return path.split("/")[-1] if path else ""


def discover_urls():
    """Return recipe URLs matching https://ciastoeli.pl/przepisy/{slug}/ ."""
    locs = []
    for sm in SITEMAPS:
        r = get(sm)
        locs.extend(re.findall(r"<loc>\s*(.*?)\s*</loc>", r.text))
    out = []
    seen = set()
    rx = re.compile(r"^https?://ciastoeli\.pl/przepisy/([^/]+)/?$", re.I)
    for l in locs:
        m = rx.match(l.strip())
        if not m:
            continue
        s = m.group(1)
        if s in seen:
            continue
        seen.add(s)
        out.append("https://ciastoeli.pl/przepisy/" + s + "/")
    return out


def iso_to_min(v):
    """ISO-8601 duration -> minutes. PT0H0M / P0D / empty -> None."""
    if not v or not isinstance(v, str):
        return None
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$", v.strip())
    if not m:
        return None
    d, h, mi, s = (int(x) if x else 0 for x in m.groups())
    total = d * 1440 + h * 60 + mi
    if total == 0 and s:
        total = 1  # round tiny sub-minute durations up
    return total or None


def clean_text(t):
    if t is None:
        return ""
    t = htmllib.unescape(str(t))
    t = re.sub(r"<[^>]+>", " ", t)          # strip any stray html
    t = re.sub(r"\s+", " ", t).strip()
    return t


def first_recipe(node):
    if isinstance(node, dict):
        t = node.get("@type")
        if t == "Recipe" or (isinstance(t, list) and "Recipe" in t):
            return node
        if "@graph" in node:
            r = first_recipe(node["@graph"])
            if r:
                return r
        for v in node.values():
            r = first_recipe(v)
            if r:
                return r
    elif isinstance(node, list):
        for v in node:
            r = first_recipe(v)
            if r:
                return r
    return None


def _img_dims(url):
    """Pull WxH from a WordPress '-1024x900' style suffix; (0,0) if absent."""
    m = re.search(r"-(\d{2,4})x(\d{2,4})\.(?:webp|jpe?g|png)(?:$|\?)", url, re.I)
    if m:
        return int(m.group(1)), int(m.group(2))
    return 0, 0


def extract_image(img):
    """image may be: str, dict{url}, ImageObject, or list of any of those.
    Prefer the largest non-square variant as the hero (avoid 250x250 thumbs)."""
    urls = []

    def collect(x):
        if not x:
            return
        if isinstance(x, str):
            urls.append(x)
        elif isinstance(x, dict):
            u = x.get("url") or x.get("contentUrl")
            if isinstance(u, str):
                urls.append(u)
        elif isinstance(x, list):
            for it in x:
                collect(it)

    collect(img)
    if not urls:
        return None
    # de-dup preserving order
    seen = set()
    uniq = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            uniq.append(u)

    def score(u):
        w, h = _img_dims(u)
        # penalise square thumbnails (e.g. 250x250) used as the listing image
        square_penalty = -10_000 if (w and w == h) else 0
        return w * h + square_penalty

    best = max(uniq, key=score)
    return best


def _strip_step_number(s):
    """Remove a leading '1. ' / '1) ' / 'Krok 1: ' style numbering."""
    s = re.sub(r"^\s*(?:krok\s*)?\d+\s*[.):\-]\s*", "", s, flags=re.I)
    return s.strip()


def _split_blob(text):
    """Split a single instruction blob into sentence-level steps."""
    text = clean_text(text)
    # prefer explicit line breaks first
    if "\n" in text:
        parts = [p for p in re.split(r"\r?\n+", text)]
    else:
        # sentence split: end punctuation followed by an uppercase (incl. PL) letter
        parts = re.split(r"(?<=[.!?])\s+(?=[A-ZŻŹĆĄŚĘŁÓŃ0-9])", text)
    parts = [_strip_step_number(clean_text(p)) for p in parts]
    return [p for p in parts if p]


def extract_instructions(ri):
    """recipeInstructions may be: str, list of HowToStep dicts, list of strings,
    or HowToSection containing itemListElement. Returns full-sentence steps."""
    steps = []
    if ri is None:
        return steps
    if isinstance(ri, str):
        steps = _split_blob(ri)
    else:
        if isinstance(ri, dict):
            ri = [ri]
        if isinstance(ri, list):
            for it in ri:
                if isinstance(it, str):
                    c = _strip_step_number(clean_text(it))
                    if c:
                        steps.append(c)
                elif isinstance(it, dict):
                    t = it.get("@type")
                    if t == "HowToSection" or "itemListElement" in it:
                        steps.extend(extract_instructions(it.get("itemListElement", [])))
                    else:
                        c = _strip_step_number(clean_text(it.get("text") or it.get("name")))
                        if c:
                            steps.append(c)
        # If the whole method came back as one big blob, split it into sentences
        # so genuine multi-step recipes aren't rejected by the thin-content guard.
        if len(steps) == 1 and len(steps[0]) > 160:
            split = _split_blob(steps[0])
            if len(split) >= 2:
                steps = split

    # de-dup consecutive + drop empties
    out = []
    for s in steps:
        if s and (not out or out[-1] != s):
            out.append(s)
    return out


def extract_yield(ry):
    if ry is None:
        return None
    candidates = ry if isinstance(ry, list) else [ry]
    for c in candidates:
        m = re.search(r"\d+", str(c))
        if m:
            n = int(m.group())
            if 0 < n < 1000:
                return n
    return None


def extract_keywords(kw):
    if not kw:
        return []
    if isinstance(kw, list):
        items = [clean_text(k) for k in kw]
    else:
        items = [clean_text(p) for p in str(kw).split(",")]
    items = [i for i in items if i]
    # de-dup preserving order
    seen = set()
    out = []
    for i in items:
        key = i.lower()
        if key not in seen:
            seen.add(key)
            out.append(i)
    return out[:5]


def extract_author(a):
    if isinstance(a, dict):
        n = a.get("name")
        if n:
            return clean_text(n)
    if isinstance(a, list) and a:
        return extract_author(a[0])
    if isinstance(a, str) and a.strip():
        return clean_text(a)
    return "Ela"


def make_description(rec, name):
    d = rec.get("description")
    d = clean_text(d) if d else ""
    if d:
        # first ~2 sentences
        sents = re.split(r"(?<=[.!?])\s+", d)
        out = " ".join(sents[:2]).strip()
        return out if out else d
    return f"{name} - przepis z bloga ciastoeli.pl."


# ---------- category guessing ----------
# order matters: more specific first
CAT_RULES = [
    ("przetwory", r"dżem|dzem|konfitur|marmolad|kiszonk|kiszon|marynat|marynowan|syrop|chutney|przetw|ogórki|ogorki małosolne|powidł|powidl"),
    ("napoje",    r"napój|napoj|kompot|lemoniad|smoothie|herbat|kawa|koktajl|sok\b|nalewk|drink|shake|poncz|oranżad|oranzad|kakao\b|cocktail"),
    ("zupy",      r"\bzupa|\bzupy|krem z |kremowa zupa|rosół|rosol|żurek|zurek|barszcz|chłodnik|chlodnik|bulion|consomm|gazpacho"),
    ("salatki",   r"sałatk|salatk|surówk|surowk|coleslaw|sałata\b"),
    ("sniadania", r"śniadan|sniadan|jajecznic|omlet|owsiank|naleśnik|nalesnik|tost|jaja\b|jajka\b|granola|musli|płatki|placuszki śniad|szakszuka|jajko"),
    ("ciasta",    r"\bciasto|\bciasta|tort\b|tarta|sernik|\bkeks|babka|babeczk|muffin|ciasteczk|ciastka|szarlotk|biszkopt|brownie|piernik|drożdżówk|drozdzowk|rolada|strucla|mazurek|makowiec|placek\b|gofry|pączki|paczki|pierniczk|bezy\b|beza\b|eklery|ptysie|kruche ciast|cupcake"),
    ("desery",   r"\bdeser|\blody|sorbet|\bkrem\b|\bmus\b|pudding|budyń|budyn|panna cotta|panna\b|galaretk|tiramisu|parfait|crumble|cheesecake|mascarpone deser|fondant"),
    ("przekaski", r"pasta\b|\bdip\b|przekąsk|przekask|przystawk|hummus|smalec|pasztet|krakers|chipsy|tapenade|grzanki|kanapk|roladki|paluszki"),
    ("dla-dzieci", r"dla dzieci|dziecięc|dzieciec|maluch|dla maluch"),
]
# obiady fallback signals
OBIAD_RX = re.compile(
    r"kurczak|kurczaka|wołowin|wolowin|wieprzow|schab|karkówk|karkowk|mięso|mieso|ryba|łosoś|losos|dorsz|"
    r"makaron|spaghetti|ryż|ryz|risotto|pierogi|kotlet|gulasz|leczo|zapiekank|placki ziemniacz|"
    r"udka|filet|indyk|kacz|gicz|żeberk|zeberk|klopsiki|pulpety|curry|stir|pizza|tortilla|burger|"
    r"warzyw|ziemniak|fasol|soczewic|ciecierzyc|kasza|naleśniki wytrawne|frytki|grill",
    re.I,
)


def guess_category(title, keywords, json_cat):
    hay = " ".join([
        title or "",
        " ".join(keywords) if isinstance(keywords, list) else (keywords or ""),
        json_cat or "",
    ]).lower()
    # Strong meat/fish/savory-main signal wins over everything (e.g. "Pieczony indyk"
    # must not fall into ciasta via a baking verb). Only the unambiguous mains here.
    if re.search(r"\bindyk|\bkurczak|\bkacz|wołowin|wolowin|wieprzow|\bschab|karkówk|karkowk|"
                 r"\błosoś|\blosos|\bdorsz|\bryba\b|\bryby\b|żeberk|zeberk|kotlet schab|gulasz|"
                 r"pierogi|\bbigos\b", hay):
        return "obiady"
    for cat, rx in CAT_RULES:
        if re.search(rx, hay):
            return cat
    if OBIAD_RX.search(hay):
        return "obiady"
    # map raw json category words as a last resort
    jc = (json_cat or "").lower()
    jc_map = {
        "śniadanie": "sniadania", "sniadanie": "sniadania",
        "deser": "desery", "desery": "desery",
        "ciasto": "ciasta", "ciasta": "ciasta", "wypieki": "ciasta",
        "zupa": "zupy", "zupy": "zupy",
        "sałatka": "salatki", "salatka": "salatki", "sałatki": "salatki",
        "obiad": "obiady", "danie główne": "obiady", "danie glowne": "obiady", "kolacja": "obiady",
        "napój": "napoje", "napoje": "napoje", "napo-je": "napoje",
        "przetwory": "przetwory", "przekąski": "przekaski", "przekaski": "przekaski",
        "przystawka": "przekaski", "przystawki": "przekaski",
    }
    for k, v in jc_map.items():
        if k in jc:
            return v
    return "obiady"


CUISINE_MAP = {
    "polska": "polska", "polish": "polska", "kuchnia polska": "polska",
    "włoska": "wloska", "wloska": "wloska", "italian": "wloska",
    "francuska": "francuska", "french": "francuska",
    "amerykańska": "amerykanska", "amerykanska": "amerykanska", "american": "amerykanska",
    "hiszpańska": "hiszpanska", "spanish": "hiszpanska",
    "grecka": "grecka", "greek": "grecka",
    "azjatycka": "azjatycka", "asian": "azjatycka",
    "meksykańska": "meksykanska", "mexican": "meksykanska",
    "niemiecka": "niemiecka", "angielska": "angielska", "british": "angielska",
    "indyjska": "indyjska", "indian": "indyjska", "tajska": "tajska", "thai": "tajska",
    "orientalna": "orientalna", "śródziemnomorska": "srodziemnomorska",
}


def norm_cuisine(c):
    if not c:
        return None
    if isinstance(c, list):
        c = c[0] if c else None
    if not c:
        return None
    key = clean_text(c).lower()
    return CUISINE_MAP.get(key, key) if key else None


def html_fallback(soup):
    """Best-effort cheerio-style extraction of ingredients + steps from WPRM/markup."""
    ingredients, steps = [], []
    if soup is None:
        return ingredients, steps
    for sel in [".wprm-recipe-ingredient", "li.wprm-recipe-ingredient",
                ".recipe-ingredient", ".ingredient", "ul.ingredients li"]:
        for el in soup.select(sel):
            t = clean_text(el.get_text(" "))
            if t:
                ingredients.append(t)
        if ingredients:
            break
    for sel in [".wprm-recipe-instruction-text", ".wprm-recipe-instruction",
                ".recipe-instruction", ".instruction", ".directions li", "ol.instructions li"]:
        for el in soup.select(sel):
            t = clean_text(el.get_text(" "))
            if t:
                steps.append(t)
        if steps:
            break
    return ingredients, steps


def scrape_one(url):
    """Return (record_or_None, status_string)."""
    slug = slug_of(url)
    try:
        r = get(url, timeout=40)
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        html = r.text
    except Exception as e:
        return None, f"FETCH_ERROR {type(e).__name__}"

    blocks = re.findall(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.S | re.I)
    rec = None
    for b in blocks:
        b2 = b.strip()
        try:
            data = json.loads(b2)
        except Exception:
            try:
                data = json.loads(htmllib.unescape(b2))
            except Exception:
                continue
        rec = first_recipe(data)
        if rec:
            break

    soup = BeautifulSoup(html, "html.parser") if HAVE_BS4 else None

    if rec:
        name = clean_text(rec.get("name")) or slug.replace("-", " ").capitalize()
        ingredients = [clean_text(i) for i in (rec.get("recipeIngredient") or []) if clean_text(i)]
        instructions = extract_instructions(rec.get("recipeInstructions"))
        image = extract_image(rec.get("image"))
        json_cat = rec.get("recipeCategory")
        if isinstance(json_cat, list):
            json_cat = ", ".join(str(x) for x in json_cat)
        keywords = extract_keywords(rec.get("keywords"))
        prep = iso_to_min(rec.get("prepTime"))
        cook = iso_to_min(rec.get("cookTime"))
        servings = extract_yield(rec.get("recipeYield"))
        cuisine = norm_cuisine(rec.get("recipeCuisine"))
        author = extract_author(rec.get("author"))
        description = make_description(rec, name)
    else:
        # HTML fallback
        ingredients, instructions = html_fallback(soup)
        if not ingredients or not instructions:
            return None, "NO_JSONLD_NO_HTML"
        name = slug.replace("-", " ").capitalize()
        if soup and soup.title:
            name = clean_text(soup.title.get_text()) or name
            name = re.split(r"\s*[-|–]\s*", name)[0].strip() or name
        image = None
        if soup:
            og = soup.find("meta", property="og:image")
            if og and og.get("content"):
                image = og["content"]
        json_cat = None
        keywords = []
        prep = cook = servings = None
        cuisine = None
        author = "Ela"
        description = f"{name} - przepis z bloga ciastoeli.pl."

    # thin-content guard
    if len(ingredients) < 2 or len(instructions) < 2:
        return None, f"THIN ({len(ingredients)} ing / {len(instructions)} steps)"

    category = guess_category(name, keywords, json_cat)
    if category not in ALLOWED_CATS:
        category = "obiady"

    record = {
        "title": name,
        "slug": slug,
        "description": description,
        "category": category,
        "cuisine": cuisine,
        "ingredients": ingredients,
        "instructions": instructions,
        "prep_time_minutes": prep,
        "cook_time_minutes": cook,
        "servings": servings,
        "tags": keywords,
        "diet_tags": [],
        "image_url": image,
        "source_url": url,
        "author": author if author else "Ela",
    }
    return record, "OK"


def main():
    all_urls = discover_urls()
    candidates = [u for u in all_urls if slug_of(u) not in SKIP]
    # The sitemap lists recipes in topical clusters (long runs of cakes, then
    # rabarbar tarts, etc.). Taking the first N sequentially yields a lopsided
    # category mix. Deterministically shuffle so the 120-recipe sample spreads
    # across the whole ~1106-recipe catalog for a richer category distribution.
    import random
    random.Random(20240531).shuffle(candidates)
    print(f"DISCOVERED total_sitemap_slugs={len(all_urls)} after_skip={len(candidates)} "
          f"(skipped {len(all_urls)-len(candidates)}); shuffled for category diversity",
          file=sys.stderr)

    records = []
    failures = []
    attempted = 0
    idx = 0
    # iterate with small concurrency; keep going past failures until we hit TARGET_COUNT
    BATCH = 8
    while len(records) < TARGET_COUNT and idx < len(candidates):
        batch = candidates[idx: idx + BATCH]
        idx += BATCH
        with ThreadPoolExecutor(max_workers=BATCH) as ex:
            futs = {ex.submit(scrape_one, u): u for u in batch}
            for fut in as_completed(futs):
                u = futs[fut]
                attempted += 1
                try:
                    rec, status = fut.result()
                except Exception as e:
                    rec, status = None, f"EXC {type(e).__name__}: {e}"
                if rec:
                    records.append(rec)
                else:
                    failures.append({"url": u, "reason": status})
        print(f"progress: ok={len(records)} fail={len(failures)} attempted={attempted}",
              file=sys.stderr)

    records = records[:TARGET_COUNT]

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    # summary stats
    from collections import Counter
    cat_dist = Counter(r["category"] for r in records)
    summary = {
        "saved": len(records),
        "attempted": attempted,
        "category_distribution": dict(sorted(cat_dist.items(), key=lambda x: -x[1])),
        "failures_count": len(failures),
        "failures_sample": failures[:25],
        "missing_fields": {
            "no_image": sum(1 for r in records if not r["image_url"]),
            "no_servings": sum(1 for r in records if r["servings"] is None),
            "no_prep": sum(1 for r in records if r["prep_time_minutes"] is None),
            "no_cook": sum(1 for r in records if r["cook_time_minutes"] is None),
            "no_cuisine": sum(1 for r in records if not r["cuisine"]),
            "no_tags": sum(1 for r in records if not r["tags"]),
        },
        "out_path": OUT_PATH,
    }
    print("SUMMARY_JSON_START")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("SUMMARY_JSON_END")


if __name__ == "__main__":
    main()
