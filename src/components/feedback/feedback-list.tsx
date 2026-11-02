'use client';

import { FeedbackCard } from './feedback-card';
import { FeedbackSkeleton } from './feedback-skeleton';
import { useProductFeedbacks } from './use-product-feedbacks';

export function FeedbackList({ productId }: { productId: string }) {
  const query = useProductFeedbacks(productId);

  if (query.isPending) {
    return <FeedbackSkeleton />;
  }

  if (query.isError) {
    return (
      <div role="alert" className="ticket-clip border border-destructive/40 bg-paper p-6 sm:p-8">
        <p className="font-display text-xl font-bold tracking-tight">
          Não foi possível carregar as avaliações.
        </p>
        <p className="mt-2 text-sm text-ink/60">Verifique sua conexão e tente novamente.</p>
        <button
          type="button"
          onClick={() => {
            void query.refetch();
          }}
          className="mt-5 inline-flex items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-brand hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const items = query.data.pages.flatMap((page) => page.items);
  const summary = query.data.pages[0]?.summary;
  const count = summary?.count ?? items.length;

  return (
    <section aria-label="Avaliações do produto">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Avaliações ({count})
        </h2>
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
          {count === 1 ? '1 ficha' : `${count} fichas`}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 border border-dashed border-ink/20 bg-paper/60 px-5 py-10 text-center text-ink/60">
          Ainda não há avaliações. Seja a primeira pessoa a avaliar.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((feedback) => (
            <li key={feedback.id}>
              <FeedbackCard feedback={feedback} />
            </li>
          ))}
        </ul>
      )}

      {query.hasNextPage && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => {
              void query.fetchNextPage();
            }}
            disabled={query.isFetchingNextPage}
            className="inline-flex w-full items-center justify-center border border-ink/30 bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {query.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}

      {query.isFetchingNextPage && (
        <div className="mt-6">
          <FeedbackSkeleton count={2} />
        </div>
      )}

      {!query.hasNextPage && items.length > 0 && (
        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.18em] text-ink/40">
          Você chegou ao fim das avaliações.
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {query.isFetchingNextPage ? 'Carregando mais avaliações.' : ''}
      </p>
    </section>
  );
}
