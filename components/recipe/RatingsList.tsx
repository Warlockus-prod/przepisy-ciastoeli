import { StarRating } from '@/components/recipe/StarRating';
import { plPolishDate } from '@/lib/format';
import type { RecipeRating } from '@/lib/db/schema';

export function RatingsList({ ratings }: { ratings: RecipeRating[] }) {
  if (ratings.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-4">
      {ratings.map((r) => (
        <li key={r.id} className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{r.author_name}</p>
              <p className="text-xs text-ink-muted">{plPolishDate(r.created_at)}</p>
            </div>
            <StarRating value={r.rating} size={16} />
          </div>
          {r.comment && <p className="mt-3 text-ink-soft">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
