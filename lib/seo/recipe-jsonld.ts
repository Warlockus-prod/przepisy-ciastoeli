import type { FaqItem, Ingredient, Instruction, Nutrition } from '@/lib/db/schema';
import type { RecipeWithAuthor } from '@/lib/db/queries/recipes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'przepisy.ciastoeli.pl';

const DIET_SCHEMA_MAP: Record<string, string> = {
  vegan: 'https://schema.org/VeganDiet',
  vegetarian: 'https://schema.org/VegetarianDiet',
  'gluten-free': 'https://schema.org/GlutenFreeDiet',
  'dairy-free': 'https://schema.org/LowLactoseDiet',
  'low-calorie': 'https://schema.org/LowCalorieDiet',
  'high-protein': 'https://schema.org/HighProteinDiet',
};

function isoDuration(minutes: number | null): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `PT${h}H${m}M`;
  if (h) return `PT${h}H`;
  return `PT${m}M`;
}

export function buildRecipeJsonLd(
  recipe: RecipeWithAuthor,
  opts: { ratings?: number; ratingAvg?: number | null } = {},
): object {
  const ingredients = recipe.ingredients as Ingredient[];
  const instructions = recipe.instructions as Instruction[];
  const nutrition = recipe.nutrition as Nutrition | null;
  const faq = recipe.faq as FaqItem[] | null;

  const url = `${SITE_URL}/przepisy/${recipe.slug}`;

  const images = [recipe.hero_image_url, recipe.square_image_url, recipe.og_image_url].filter(Boolean) as string[];

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: images.length > 0 ? images : [recipe.hero_image_url],
    datePublished: recipe.published_at?.toISOString(),
    dateModified: recipe.updated_at.toISOString(),
    inLanguage: 'pl-PL',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },

    author: {
      '@type': 'Person',
      name: recipe.author.name,
      url: `${SITE_URL}/autor/${recipe.author.slug}`,
      jobTitle: recipe.author.role,
    },

    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-1200.png`, width: 1200, height: 630 },
    },

    recipeCategory: recipe.category_slug,
    recipeCuisine: recipe.cuisine_slug ?? undefined,
    recipeYield: `${recipe.servings} ${recipe.servings === 1 ? 'porcja' : 'porcji'}`,

    prepTime: isoDuration(recipe.prep_time),
    cookTime: isoDuration(recipe.cook_time),
    totalTime: isoDuration(recipe.total_time),

    recipeIngredient: ingredients.map((i) => i.raw),

    recipeInstructions: instructions.map((s) => ({
      '@type': 'HowToStep',
      name: `Krok ${s.step}`,
      text: s.text,
      url: `${url}#krok-${s.step}`,
      ...(s.image_url ? { image: s.image_url } : {}),
    })),

    keywords: recipe.tags.length > 0 ? recipe.tags.join(', ') : undefined,
    suitableForDiet: recipe.diet_tags.map((d) => DIET_SCHEMA_MAP[d]).filter(Boolean),
  };

  if (nutrition) {
    json.nutrition = {
      '@type': 'NutritionInformation',
      calories: `${nutrition.kcal} kcal`,
      proteinContent: `${nutrition.protein_g} g`,
      carbohydrateContent: `${nutrition.carbs_g} g`,
      fatContent: `${nutrition.fat_g} g`,
      fiberContent: nutrition.fiber_g != null ? `${nutrition.fiber_g} g` : undefined,
      sugarContent: nutrition.sugar_g != null ? `${nutrition.sugar_g} g` : undefined,
      sodiumContent: nutrition.sodium_mg != null ? `${nutrition.sodium_mg} mg` : undefined,
      saturatedFatContent: nutrition.saturated_fat_g != null ? `${nutrition.saturated_fat_g} g` : undefined,
      servingSize: '1 porcja',
    };
  }

  if (opts.ratings && opts.ratingAvg != null && opts.ratings > 0) {
    json.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (opts.ratingAvg / 10).toFixed(1),
      ratingCount: opts.ratings,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (faq && faq.length > 0) {
    json['@graph'] = [
      { ...json },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ];
  }

  return json;
}

export function buildBreadcrumbsJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

