import { Clock, Thermometer } from 'lucide-react';

import { OptimizedImage } from '@/components/OptimizedImage';
import type { Instruction } from '@/lib/db/schema';

export function InstructionSteps({ steps }: { steps: Instruction[] }) {
  return (
    <section aria-labelledby="instructions-heading" className="space-y-6">
      <h2 id="instructions-heading" className="font-display text-2xl font-semibold">
        Sposób przygotowania
      </h2>

      <ol className="space-y-6">
        {steps.map((step) => (
          <li key={step.step} id={`krok-${step.step}`} className="recipe-step group relative rounded-lg border border-line bg-surface p-6 sm:p-7">
            <div className="mb-3 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold leading-none text-terracotta">{step.step}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">krok</span>
            </div>

            <p className="text-base leading-relaxed text-ink sm:text-[17px]">{step.text}</p>

            {(step.duration_minutes != null || step.temperature_c != null) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                {step.duration_minutes != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {step.duration_minutes} min
                  </span>
                )}
                {step.temperature_c != null && (
                  <span className="inline-flex items-center gap-1">
                    <Thermometer size={12} /> {step.temperature_c} °C
                  </span>
                )}
              </div>
            )}

            {step.tip && (
              <div className="mt-4 rounded-md border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Wskazówka:</span> {step.tip}
              </div>
            )}

            {step.image_url && (
              <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-md bg-cream-deep">
                <OptimizedImage
                  src={step.image_url}
                  alt={step.image_alt ?? `Krok ${step.step}`}
                  fill
                  sizes="(min-width: 768px) 720px, 100vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
