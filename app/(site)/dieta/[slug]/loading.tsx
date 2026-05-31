import { RecipeGridSkeleton } from '@/components/recipe/RecipeCardSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-4 w-80 max-w-full rounded" />
      </div>
      <RecipeGridSkeleton count={8} />
    </div>
  );
}
