import type * as React from 'react';
import { cn } from '@/lib/utils';

export const SCORE_LABELS: Record<number, string> = {
  1: 'Ruim',
  2: 'Fraco',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
};

const STAR_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
} as const;

type StarSize = keyof typeof STAR_SIZES;

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn(className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
    >
      <path d="M12 2.6l2.83 5.73 6.32.92-4.57 4.46 1.08 6.3L12 17.04l-5.66 2.97 1.08-6.3-4.57-4.46 6.32-.92L12 2.6z" />
    </svg>
  );
}

type StarRatingProps = {
  value: number;
  size?: StarSize;
  className?: string;
};

/**
 * Exibição somente leitura de 0–5 estrelas. O texto alternativo resume a nota
 * para tecnologias assistivas; os ícones são decorativos.
 */
export function StarRating({ value, size = 'md', className }: StarRatingProps) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  const label = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return (
    <span
      role="img"
      aria-label={`${label} de 5 estrelas`}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          filled={score <= rounded}
          className={cn(STAR_SIZES[size], score <= rounded ? 'text-accent' : 'text-ink/20')}
        />
      ))}
    </span>
  );
}

type StarRatingInputProps = Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue'> & {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
};

/**
 * Grupo de rádio acessível para escolher a nota.
 *
 * Usa inputs `radio` nativos (teclado e leitores de tela funcionam de graça) e
 * deixa o rótulo visual em volta de cada estrela.
 */
export function StarRatingInput({
  value,
  onChange,
  onBlur,
  name = 'score',
  disabled = false,
  className,
  ...props
}: StarRatingInputProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)} {...props}>
      <div
        role="radiogroup"
        aria-label="Nota de 1 a 5 estrelas"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((score) => (
          <label
            key={score}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center p-1 transition-colors',
              'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-paper',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
              onBlur={onBlur}
              disabled={disabled}
              className="sr-only"
              aria-label={`${score} de 5 — ${SCORE_LABELS[score]}`}
            />
            <Star
              filled={score <= value}
              className={cn(
                'h-9 w-9 transition-colors',
                score <= value ? 'text-accent' : 'text-ink/25',
                !disabled && score > value && 'hover:text-ink/50',
              )}
            />
          </label>
        ))}
      </div>

      <span className="text-sm text-ink/60" aria-live="polite">
        {value > 0 ? `${value} — ${SCORE_LABELS[value]}` : 'Escolha uma nota'}
      </span>
    </div>
  );
}
