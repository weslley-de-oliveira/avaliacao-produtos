export function ProductEmptyState() {
  return (
    <div className="relative mt-10">
      <div
        aria-hidden="true"
        className="ticket-clip absolute inset-0 translate-x-1.5 translate-y-1.5 bg-ink/10"
      />

      <div className="ticket-clip relative border border-ink bg-paper px-6 py-12 sm:px-10">
        <span aria-hidden="true" className="block h-1.5 w-14 bg-accent" />
        <p className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Nenhum produto por aqui ainda.
        </p>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ink/60">
          O catálogo é atualizado manualmente. Volte mais tarde para ver o que chegou.
        </p>
      </div>
    </div>
  );
}
