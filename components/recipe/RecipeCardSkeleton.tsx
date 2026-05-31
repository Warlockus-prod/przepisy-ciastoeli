export function RecipeCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="mt-3 flex justify-between">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

export function RecipeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}
