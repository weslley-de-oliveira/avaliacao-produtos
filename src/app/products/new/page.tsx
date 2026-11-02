import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProductForm } from '@/components/products/product-form';
import { isAdmin } from '@/lib/auth/session-account';
import { getCurrentAccount } from '@/server/auth/current-account';

export const metadata: Metadata = {
  title: 'Novo produto | Avaliação de Produtos',
  description: 'Cadastre um novo produto no catálogo.',
};

export default async function NewProductPage() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect(`/auth/sign-in?redirect=${encodeURIComponent('/products/new')}`);
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 lg:py-14">
        {isAdmin(account) ? (
          <ProductForm />
        ) : (
          <section
            aria-labelledby="admin-required-title"
            className="border border-ink/15 bg-ink text-paper"
          >
            <div aria-hidden="true" className="h-1.5 bg-accent" />
            <div className="p-6 sm:p-8">
              <h1
                id="admin-required-title"
                className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Acesso restrito
              </h1>
              <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-paper/80 sm:text-base">
                Apenas administradores podem cadastrar produtos.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center border border-paper/40 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Voltar ao catálogo
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
