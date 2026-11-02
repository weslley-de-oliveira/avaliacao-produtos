const SKELETON_ITEMS = [0, 1, 2];

export function FeedbackSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:items-start lg:gap-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
          <div className="h-7 w-40 animate-pulse bg-ink/10 motion-reduce:animate-none" />
          <div className="h-4 w-8 animate-pulse bg-ink/10 motion-reduce:animate-none" />
        </div>

        <div className="mt-6 space-y-4">
          {SKELETON_ITEMS.slice(0, Math.max(1, count)).map((item) => (
            <div key={item} className="ticket-clip border border-ink/10 bg-paper p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse bg-ink/10 motion-reduce:animate-none" />
                <div className="space-y-2">
                  <div className="h-3 w-36 animate-pulse bg-ink/10 motion-reduce:animate-none" />
                  <div className="h-3 w-24 animate-pulse bg-ink/10 motion-reduce:animate-none" />
                </div>
              </div>
              <div className="mt-4 h-3 w-full animate-pulse bg-ink/10 motion-reduce:animate-none" />
              <div className="mt-2 h-3 w-4/5 animate-pulse bg-ink/10 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="border border-ink/10 bg-paper">
          <div className="h-1.5 bg-accent/50" />
          <div className="space-y-3 p-6">
            <div className="h-3 w-24 animate-pulse bg-ink/10 motion-reduce:animate-none" />
            <div className="h-12 w-32 animate-pulse bg-ink/10 motion-reduce:animate-none" />
            <div className="h-3 w-28 animate-pulse bg-ink/10 motion-reduce:animate-none" />
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-2.5">
                <div className="h-2 w-2 animate-pulse bg-ink/10 motion-reduce:animate-none" />
                <div className="h-2 flex-1 animate-pulse bg-ink/10 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Carregando avaliações…</span>
    </div>
  );
}
