import { buildBreadcrumbsJsonLd, buildRecipeJsonLd } from '@/lib/seo/recipe-jsonld';
import type { RecipeWithAuthor } from '@/lib/db/queries/recipes';

export function RecipeStructuredData({
  recipe,
  breadcrumbs,
}: {
  recipe: RecipeWithAuthor;
  breadcrumbs: Array<{ name: string; url: string }>;
}) {
  const recipeJsonLd = buildRecipeJsonLd(recipe, {
    ratings: recipe.rating_count,
    ratingAvg: recipe.rating_avg,
  });
  const breadcrumbsJsonLd = buildBreadcrumbsJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
    </>
  );
}
