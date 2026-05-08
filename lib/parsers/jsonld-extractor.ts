import * as cheerio from 'cheerio';

export type ExtractedRecipe = {
  source: 'jsonld' | 'cheerio' | 'mixed';
  title: string;
  description: string;
  image_url: string | null;
  ingredients: string[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  servings: number | null;
  category: string | null;
  cuisine: string | null;
  keywords: string[];
  author: string | null;
  date_published: string | null;
};

type LDNode = {
  '@type'?: string | string[];
  '@graph'?: LDNode[];
  [k: string]: unknown;
};

export function extractRecipeFromHtml(html: string, baseUrl: string): ExtractedRecipe | null {
  const $ = cheerio.load(html);

  // 1. Try JSON-LD Recipe
  const fromLd = extractFromJsonLd($);
  if (fromLd) return fromLd;

  // 2. Cheerio fallback (heuristic)
  return extractFromHtml($, baseUrl);
}

function extractFromJsonLd($: cheerio.CheerioAPI): ExtractedRecipe | null {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    const raw = $(el).contents().text().trim();
    if (!raw) continue;
    let data: LDNode | LDNode[];
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const recipes = collectRecipes(data);
    if (recipes.length > 0) {
      return mapJsonLdRecipe(recipes[0]);
    }
  }
  return null;
}

function collectRecipes(node: LDNode | LDNode[]): LDNode[] {
  if (Array.isArray(node)) return node.flatMap(collectRecipes);
  if (!node || typeof node !== 'object') return [];
  const t = node['@type'];
  const types = Array.isArray(t) ? t : [t].filter(Boolean);
  if (types.includes('Recipe')) return [node];
  if (Array.isArray(node['@graph'])) return collectRecipes(node['@graph']);
  return [];
}

function mapJsonLdRecipe(r: LDNode): ExtractedRecipe {
  const ingredients = asStringArray(r.recipeIngredient ?? r.ingredients ?? []);
  const instructions = parseInstructions(r.recipeInstructions);
  const image_url = parseImage(r.image);
  const author = parseAuthor(r.author);
  const datePublished = typeof r.datePublished === 'string' ? r.datePublished : null;

  return {
    source: 'jsonld',
    title: typeof r.name === 'string' ? r.name : '',
    description: typeof r.description === 'string' ? r.description : '',
    image_url,
    ingredients,
    instructions,
    prep_time_minutes: parseIsoDurationMinutes(r.prepTime),
    cook_time_minutes: parseIsoDurationMinutes(r.cookTime),
    total_time_minutes: parseIsoDurationMinutes(r.totalTime),
    servings: parseServings(r.recipeYield),
    category: typeof r.recipeCategory === 'string' ? r.recipeCategory : Array.isArray(r.recipeCategory) ? String(r.recipeCategory[0]) : null,
    cuisine: typeof r.recipeCuisine === 'string' ? r.recipeCuisine : Array.isArray(r.recipeCuisine) ? String(r.recipeCuisine[0]) : null,
    keywords: typeof r.keywords === 'string' ? r.keywords.split(/,\s*/) : Array.isArray(r.keywords) ? r.keywords.map(String) : [],
    author,
    date_published: datePublished,
  };
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : String(x))).filter(Boolean);
  if (typeof v === 'string') return [v];
  return [];
}

function parseInstructions(v: unknown): string[] {
  if (!v) return [];
  if (typeof v === 'string') {
    return v.split(/\.\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 5);
  }
  if (Array.isArray(v)) {
    return v
      .map((step) => {
        if (typeof step === 'string') return step;
        if (typeof step === 'object' && step) {
          const s = step as Record<string, unknown>;
          if (typeof s.text === 'string') return s.text;
          if (typeof s.name === 'string') return s.name;
          // HowToSection: contains itemListElement
          if (Array.isArray(s.itemListElement)) {
            return s.itemListElement
              .map((sub: unknown) => {
                if (typeof sub === 'object' && sub && typeof (sub as Record<string, unknown>).text === 'string') {
                  return (sub as Record<string, unknown>).text as string;
                }
                return '';
              })
              .filter(Boolean)
              .join('\n');
          }
        }
        return '';
      })
      .filter(Boolean)
      .flatMap((s) => s.split(/\n+/).map((x) => x.trim()).filter(Boolean));
  }
  return [];
}

function parseImage(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return parseImage(v[0]);
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
    if (typeof obj['@id'] === 'string') return obj['@id'] as string;
  }
  return null;
}

function parseAuthor(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return parseAuthor(v[0]);
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.name === 'string') return obj.name;
  }
  return null;
}

function parseIsoDurationMinutes(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const m = v.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] ?? '0', 10);
  const min = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  const total = h * 60 + min + Math.round(s / 60);
  return total > 0 ? total : null;
}

function parseServings(v: unknown): number | null {
  if (typeof v === 'number') return Math.round(v);
  if (Array.isArray(v)) return parseServings(v[0]);
  if (typeof v === 'string') {
    const m = v.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function extractFromHtml($: cheerio.CheerioAPI, baseUrl: string): ExtractedRecipe | null {
  // Heuristic fallback: title + first decent <ul>/<ol> as ingredients/steps
  const title =
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    '';
  if (!title) return null;

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const image_url =
    $('meta[property="og:image"]').attr('content') ||
    new URL($('img').first().attr('src') ?? '/', baseUrl).toString() ||
    null;

  const ingredients: string[] = [];
  const instructions: string[] = [];

  $('ul li, ol li').each((_, li) => {
    const text = $(li).text().trim().replace(/\s+/g, ' ');
    if (!text) return;
    // Heuristic: short lines with units → ingredients
    if (
      text.length < 200 &&
      /\b(g|kg|ml|l|szklank|łyżk|łyżeczk|szt|opakowani|szczypt|cm)\b/i.test(text) &&
      ingredients.length < 30
    ) {
      ingredients.push(text);
    } else if (text.length >= 30 && instructions.length < 30) {
      instructions.push(text);
    }
  });

  return {
    source: 'cheerio',
    title,
    description,
    image_url: image_url || null,
    ingredients,
    instructions,
    prep_time_minutes: null,
    cook_time_minutes: null,
    total_time_minutes: null,
    servings: null,
    category: null,
    cuisine: null,
    keywords: [],
    author: $('meta[name="author"]').attr('content') ?? null,
    date_published: $('meta[property="article:published_time"]').attr('content') ?? null,
  };
}
