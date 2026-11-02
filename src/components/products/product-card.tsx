import Link from 'next/link';
import type { Product } from '@/lib/validations/product';
import { ProductImage } from './product-image';

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const productHref = `/products/${product.id}`;

  return (
    <div className="group relative h-full">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-2 translate-y-2 bg-brand-deep opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      />

      <article className="relative flex h-full flex-col border border-ink bg-paper transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-focus-within:-translate-x-0.5 group-focus-within:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-within:translate-x-0 motion-reduce:group-focus-within:translate-y-0">
        <div className="relative border-b border-ink">
          <Link
            href={productHref}
            tabIndex={-1}
            aria-hidden="true"
            className="block focus-visible:outline-none"
          >
            <ProductImage product={product} priority={priority} />
          </Link>
          <span aria-hidden="true" className="absolute left-0 top-0 h-1.5 w-16 bg-accent" />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="flex items-start gap-2.5 font-display text-xl font-semibold leading-tight tracking-tight">
            <span aria-hidden="true" className="mt-1 block h-5 w-[3px] shrink-0 bg-accent" />
            <Link
              href={productHref}
              className="rounded-none hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {product.name}
            </Link>
          </h3>
        </div>
      </article>
    </div>
  );
}
