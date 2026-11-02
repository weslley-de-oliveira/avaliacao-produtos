'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Product } from '@/lib/validations/product';

const IMAGE_SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

type ProductImageProps = {
  product: Product;
  priority?: boolean;
};

export function ProductImage({ product, priority = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const imageUrl = product.imageUrl?.trim();
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={`relative w-full overflow-hidden bg-ink ${showImage ? '' : 'aspect-[4/3]'}`}>
      {showImage ? (
        // Sem `fill`: a altura acompanha a proporção da imagem, que ocupa toda a
        // largura do card sem cortes. width/height só reservam espaço até carregar.
        <Image
          src={imageUrl as string}
          alt={`Imagem de ${product.name}`}
          width={1200}
          height={1200}
          priority={priority}
          sizes={IMAGE_SIZES}
          className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={`Sem imagem para ${product.name}`}
          className="flex h-full w-full items-center justify-center bg-ink"
        >
          <span aria-hidden="true" className="absolute bottom-0 right-0 h-12 w-12 bg-accent" />
          <span
            aria-hidden="true"
            className="relative font-display text-4xl font-bold tracking-tight text-accent"
          >
            {getInitials(product.name)}
          </span>
        </div>
      )}
    </div>
  );
}
