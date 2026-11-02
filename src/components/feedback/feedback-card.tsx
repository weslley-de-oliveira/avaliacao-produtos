import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import type { Feedback } from '@/lib/validations/feedback';
import { StarRating } from './star-rating';

function fullName(feedback: Feedback): string {
  return `${feedback.author.firstName} ${feedback.author.lastName}`.trim();
}

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

function relativeDate(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const name = fullName(feedback);

  return (
    <article className="ticket-clip border border-ink/15 bg-paper p-5 sm:p-6">
      <header className="flex items-start gap-3">
        <Image
          src={avatarUrl(name || feedback.author.id)}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 border border-ink/10 bg-secondary"
          unoptimized
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="font-display text-base font-semibold leading-tight">{name}</p>
            <time
              dateTime={feedback.createdAt}
              className="text-[11px] uppercase tracking-[0.14em] text-ink/45"
            >
              {relativeDate(feedback.createdAt)}
            </time>
          </div>

          <StarRating value={feedback.score} size="sm" className="mt-1.5" />
        </div>
      </header>

      <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">
        {feedback.comment}
      </p>
    </article>
  );
}
