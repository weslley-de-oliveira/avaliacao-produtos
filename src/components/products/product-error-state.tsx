'use client';

type ProductErrorStateProps = {
  onRetry: () => void;
};

export function ProductErrorState({ onRetry }: ProductErrorStateProps) {
  return (
    <div role="alert" className="relative mt-10">
      <div
        aria-hidden="true"
        className="ticket-clip absolute inset-0 translate-x-1.5 translate-y-1.5 bg-destructive"
      />

      <div className="ticket-clip relative border border-ink bg-paper px-6 py-12 sm:px-10">
        <span aria-hidden="true" className="block h-1.5 w-14 bg-destructive" />
        <p className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Não foi possível carregar os produtos.
        </p>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ink/60">
          Verifique sua conexão e tente de novo.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 inline-flex h-11 items-center justify-center rounded-none bg-ink px-5 font-display text-sm font-semibold text-paper transition-colors hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transition-none"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
