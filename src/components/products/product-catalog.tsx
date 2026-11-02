'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/trpc/client';
import { ProductCard } from './product-card';
import { ProductEmptyState } from './product-empty-state';
import { ProductErrorState } from './product-error-state';
import { ProductGridSkeleton } from './product-grid-skeleton';

const PAGE_SIZE = 9;

export function ProductCatalog() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const listQuery = api.products.list.useInfiniteQuery(
    { limit: PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  );

  const items = listQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const hasItems = items.length > 0;
  const showInitialLoading = listQuery.isPending;
  const showInitialError = listQuery.isError && !hasItems;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = listQuery;

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasNextPage || isFetchingNextPage || listQuery.isError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, listQuery.isError, fetchNextPage]);

  const countLabel =
    showInitialLoading || showInitialError ? '—' : `${items.length}${hasNextPage ? '+' : ''}`;

  return (
    <section id="catalogo" className="scroll-mt-24 px-5 pb-20 sm:px-8 lg:pb-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Produtos</h2>
            <p className="mt-2 text-sm text-ink/60">
              Abra um produto para ler o que quem já testou achou.
            </p>
          </div>

          <p aria-live="polite" className="text-sm text-ink/60">
            <span className="font-display text-lg font-semibold text-ink">{countLabel}</span> no
            catálogo
          </p>
        </div>

        <p className="sr-only" aria-live="polite">
          {isFetchingNextPage ? 'Carregando mais produtos.' : ''}
        </p>

        {showInitialLoading && (
          <div className="mt-8">
            <ProductGridSkeleton count={6} />
          </div>
        )}

        {showInitialError && (
          <ProductErrorState
            onRetry={() => {
              void listQuery.refetch();
            }}
          />
        )}

        {!showInitialLoading && !showInitialError && !hasItems && <ProductEmptyState />}

        {hasItems && (
          <>
            <div
              aria-busy={isFetchingNextPage}
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>

            {isFetchingNextPage && (
              <div className="mt-6">
                <ProductGridSkeleton count={3} />
              </div>
            )}

            {listQuery.isError && !isFetchingNextPage && (
              <div
                role="alert"
                className="mt-8 flex flex-wrap items-center gap-4 border border-destructive px-5 py-4"
              >
                <p className="text-sm text-ink/70">Não foi possível carregar mais produtos.</p>
                <button
                  type="button"
                  onClick={() => {
                    void fetchNextPage();
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-none bg-ink px-4 font-display text-sm font-semibold text-paper transition-colors hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transition-none"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!hasNextPage && !listQuery.isError && (
              <p className="mt-12 flex items-center gap-4 text-sm text-ink/50">
                <span aria-hidden="true" className="h-px flex-1 bg-ink/15" />
                Você chegou ao fim do catálogo.
                <span aria-hidden="true" className="h-px flex-1 bg-ink/15" />
              </p>
            )}
          </>
        )}

        {hasNextPage && <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />}
      </div>
    </section>
  );
}
