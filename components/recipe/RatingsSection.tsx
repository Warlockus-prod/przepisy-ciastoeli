import { RatingDistribution } from '@/components/recipe/RatingDistribution';
import { RatingForm } from '@/components/recipe/RatingForm';
import { RatingsList } from '@/components/recipe/RatingsList';
import { getRatingDistribution, listApprovedRatings } from '@/lib/db/queries/ratings';

export async function RatingsSection({
  recipeId,
  ratingAvg,
  ratingCount,
}: {
  recipeId: number;
  ratingAvg: number | null;
  ratingCount: number;
}) {
  const [distribution, ratings] = await Promise.all([
    getRatingDistribution(recipeId),
    listApprovedRatings(recipeId, 10),
  ]);

  return (
    <section aria-labelledby="ratings-heading" className="space-y-6">
      <h2 id="ratings-heading" className="font-display text-2xl font-semibold">
        Oceny i opinie
      </h2>

      <RatingDistribution avg={ratingAvg} count={ratingCount} distribution={distribution} />

      {ratings.length > 0 && <RatingsList ratings={ratings} />}

      <RatingForm recipeId={recipeId} />
    </section>
  );
}
