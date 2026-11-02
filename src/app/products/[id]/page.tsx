import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AuthRequiredBlock } from '@/components/feedback/auth-required-block';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { FeedbackList } from '@/components/feedback/feedback-list';
import { FeedbackOverview } from '@/components/feedback/feedback-overview';
import { ProductDetailHero } from '@/components/products/product-detail-hero';
import type { Product } from '@/lib/validations/product';
import { createServerCaller } from '@/server/api/caller';
import { getCurrentAccount } from '@/server/auth/current-account';

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Busca o produto uma única vez por requisição (compartilhado entre
 * `generateMetadata` e a página). Retorna `null` quando não existe ou quando o
 * id é inválido; erros inesperados também viram 404 para não vazar detalhes.
 */
const loadProduct = cache(async (id: string): Promise<Product | null> => {
  const productId = id.trim();

  if (!productId) {
    return null;
  }

  try {
    const caller = await createServerCaller();
    return await caller.products.byId({ id: productId });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    return { title: 'Produto não encontrado | Avaliação de Produtos' };
  }

  return {
    title: `${product.name} | Avaliação de Produtos`,
    description:
      product.description?.trim() || 'Veja avaliações, notas e opiniões sobre este produto.',
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const [product, account] = await Promise.all([loadProduct(id), getCurrentAccount()]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <ProductDetailHero product={product} />

        {/* Nota geral e resumo por IA à esquerda; formulário à direita. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <FeedbackOverview productId={product.id} />

          {account ? (
            <FeedbackForm productId={product.id} />
          ) : (
            <AuthRequiredBlock productId={product.id} />
          )}
        </div>

        <FeedbackList productId={product.id} />
      </div>
    </main>
  );
}
