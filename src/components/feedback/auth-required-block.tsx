import Link from 'next/link';

export function AuthRequiredBlock({ productId }: { productId: string }) {
  const redirect = encodeURIComponent(`/products/${productId}`);

  return (
    <section
      aria-labelledby="auth-required-title"
      className="relative border border-ink/15 bg-ink text-paper"
    >
      <div aria-hidden="true" className="h-1.5 bg-accent" />

      <div className="p-6 sm:p-8">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/60">
          <span aria-hidden="true" className="flex items-end gap-[3px]">
            <span className="w-[3px] bg-accent" style={{ height: 8 }} />
            <span className="w-[3px] bg-accent" style={{ height: 12 }} />
            <span className="w-[3px] bg-accent" style={{ height: 16 }} />
          </span>
          Avaliação
        </p>

        <h2
          id="auth-required-title"
          className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Entre para avaliar este produto.
        </h2>
        <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-paper/80 sm:text-base">
          Sua opinião ajuda quem está decidindo.
        </p>

        <Link
          href={`/auth/sign-in?redirect=${redirect}`}
          className="mt-6 inline-flex items-center justify-center border border-paper/40 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent hover:bg-accent hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Entrar
        </Link>
      </div>
    </section>
  );
}
