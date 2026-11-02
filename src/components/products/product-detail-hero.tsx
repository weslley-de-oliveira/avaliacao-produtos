import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/validations/product';

const BRAND_BARS = [8, 12, 16];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function ProductDetailHero({ product }: { product: Product }) {
  const description = product.description?.trim();

  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="ticket-clip absolute inset-0 translate-x-1.5 translate-y-1.5 bg-brand-deep sm:translate-x-2 sm:translate-y-2"
      />

      <div className="ticket-clip relative bg-ink px-5 py-6 text-paper sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        {/*
          No desktop a etiqueta ocupa a 1ª linha só na coluna do texto, para o
          topo da imagem alinhar com o título (2ª linha). No mobile segue a ordem
          do DOM: imagem + botão, etiqueta, título e descrição.
        */}
        <div className="grid gap-y-7 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start sm:gap-x-8 sm:gap-y-3 lg:gap-x-10">
          <div className="flex w-full max-w-sm flex-col gap-4 sm:col-start-1 sm:row-start-2">
            <div className="ticket-clip relative w-full bg-paper p-2">
              <div className="relative w-full overflow-hidden bg-ink">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={1200}
                    height={1200}
                    priority
                    sizes="(min-width: 640px) 256px, 100vw"
                    className="block h-auto w-full"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex aspect-[4/3] items-center justify-center font-display text-4xl font-bold tracking-tight text-accent"
                  >
                    {initials(product.name)}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={product.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 border border-paper/40 px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent hover:bg-accent hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Ver na loja
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/60 sm:col-start-2 sm:row-start-1">
            <span aria-hidden="true" className="flex items-end gap-[3px]">
              {BRAND_BARS.map((height) => (
                <span key={height} className="w-[3px] bg-accent" style={{ height }} />
              ))}
            </span>
            Dossiê do produto
          </p>

          <div className="-mt-4 min-w-0 sm:col-start-2 sm:row-start-2 sm:mt-0">
            <h1 className="text-balance font-display text-3xl font-bold leading-[1.02] tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <p className="mt-3 max-w-[60ch] whitespace-pre-line text-sm leading-relaxed text-paper/80 sm:text-base">
              {description || 'Sem descrição.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
