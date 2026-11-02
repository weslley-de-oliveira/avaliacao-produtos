import type { FeedbackSummary } from '@/lib/validations/feedback';
import { StarRating } from './star-rating';

const SCORES = [5, 4, 3, 2, 1] as const;

function formatAverage(average: number): string {
  return average.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function reviewCountLabel(count: number): string {
  return count === 1 ? '1 avaliação' : `${count} avaliações`;
}

export function RatingSummary({ summary }: { summary: FeedbackSummary }) {
  const { average, count, distribution } = summary;

  return (
    <section
      aria-labelledby="rating-summary-title"
      className="relative border border-ink/15 bg-paper"
    >
      <div aria-hidden="true" className="h-1.5 bg-accent" />

      <div className="p-5 sm:p-6">
        <h2
          id="rating-summary-title"
          className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55"
        >
          Nota geral
        </h2>

        {count === 0 || average === null ? (
          <p className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight">
            Ainda sem nota
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
            <p className="font-display text-5xl font-bold leading-none tracking-[-0.03em]">
              {formatAverage(average)}
            </p>
            <div className="pb-1">
              <StarRating value={average} size="md" />
            </div>
          </div>
        )}

        <p className="mt-2 text-sm text-ink/55">{reviewCountLabel(count)}</p>

        <ul className="mt-6 space-y-2.5">
          {SCORES.map((score) => {
            const scoreCount = distribution[score];
            const percent = count === 0 ? 0 : Math.round((scoreCount / count) * 100);

            return (
              <li key={score} className="flex items-center gap-2.5 text-xs">
                <span className="w-3 font-display font-semibold text-ink/70">{score}</span>
                <span aria-hidden="true" className="relative h-2 flex-1 bg-ink/10">
                  <span
                    className="absolute inset-y-0 left-0 bg-brand transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-7 text-right tabular-nums text-ink/55">{scoreCount}</span>
              </li>
            );
          })}
        </ul>

        <p className="sr-only">
          Distribuição de notas:{' '}
          {SCORES.map((score) => `${score} estrelas: ${distribution[score]}`).join('; ')}.
        </p>
      </div>
    </section>
  );
}
