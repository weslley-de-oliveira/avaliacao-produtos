const RATING_BARS = ['h-4', 'h-6', 'h-8', 'h-10', 'h-12'];

export function HomeHero() {
  return (
    <section className="px-5 pb-14 pt-8 sm:px-8 sm:pt-10 lg:pb-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative">
          <div
            aria-hidden="true"
            className="ticket-clip absolute inset-0 translate-x-2 translate-y-2 bg-brand-deep sm:translate-x-3 sm:translate-y-3"
          />

          <div className="ticket-clip relative bg-ink px-6 py-10 text-paper sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:items-end lg:gap-14">
              <div>
                <h1 className="max-w-[17ch] text-balance font-display text-4xl font-bold leading-[0.95] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                  Leia antes de comprar. Avalie depois de usar.
                </h1>

                <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-paper/80 sm:text-lg">
                  Produtos avaliados por quem já testou.
                </p>

                <a
                  href="#catalogo"
                  className="mt-8 inline-flex h-12 items-center justify-center rounded-none bg-accent px-6 font-display text-base font-semibold text-paper transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  Explorar produtos
                </a>
              </div>

              <div className="ticket-clip relative bg-paper text-ink">
                <div className="h-2 bg-accent" />

                <div className="px-6 py-6 sm:px-7">
                  <div className="flex items-end gap-1.5" aria-hidden="true">
                    {RATING_BARS.map((height) => (
                      <span key={height} className={`w-2 bg-brand ${height}`} />
                    ))}
                  </div>

                  <p className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight">
                    A nota vem de quem usou.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    Cada avaliação vai de 1 a 5. Sem patrocínio, sem nota de fachada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
