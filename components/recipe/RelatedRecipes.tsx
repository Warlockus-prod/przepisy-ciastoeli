import { RecipeCard } from '@/components/recipe/RecipeCard';
import { listRelatedRecipes } from '@/lib/db/queries/recipes';
import type { Recipe } from '@/lib/db/schema';

export async function RelatedRecipes({ recipe }: { recipe: Recipe }) {
  const related = await listRelatedRecipes(recipe, 4);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="related-recipes mt-16">
      <h2 id="related-heading" className="font-display text-2xl font-semibold">
        Może ci się spodobać
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </section>
  );
}
