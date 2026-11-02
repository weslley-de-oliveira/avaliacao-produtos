import type { Metadata } from 'next';
import { HomeHero } from '@/components/products/home-hero';
import { ProductCatalog } from '@/components/products/product-catalog';

export const metadata: Metadata = {
  title: 'Catálogo de produtos | Avaliação de Produtos',
  description:
    'Leia antes de comprar, avalie depois de usar. Produtos avaliados por quem já testou.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <HomeHero />
      <ProductCatalog />
    </main>
  );
}
