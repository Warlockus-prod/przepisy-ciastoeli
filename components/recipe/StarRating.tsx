import { Star } from 'lucide-react';

export function StarRating({
  value,
  max = 5,
  size = 18,
  className = '',
}: {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}) {
  const full = Math.floor(value);
  const partial = value - full;
  return (
    <div className={`inline-flex items-center gap-0.5 text-gold ${className}`} aria-label={`${value} z ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const isFull = i < full;
        const isPartial = i === full && partial > 0.05;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={1.5} className="absolute inset-0 text-gold/40" />
            {isFull && <Star size={size} strokeWidth={1.5} fill="currentColor" className="absolute inset-0" />}
            {isPartial && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${partial * 100}%` }}>
                <Star size={size} strokeWidth={1.5} fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
