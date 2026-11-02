'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/auth/user-menu';
import { Button } from '@/components/ui/button';
import { isAdmin, type SessionAccount } from '@/lib/auth/session-account';

const WORDMARK_BARS = [8, 12, 16];

type SiteHeaderProps = {
  account: SessionAccount | null;
};

export function SiteHeader({ account }: SiteHeaderProps) {
  const pathname = usePathname();

  // A tela de autenticação tem layout próprio, sem cabeçalho global.
  if (pathname === '/auth' || pathname?.startsWith('/auth/')) {
    return null;
  }

  const signInHref =
    pathname && pathname !== '/'
      ? `/auth/sign-in?redirect=${encodeURIComponent(pathname)}`
      : '/auth/sign-in';

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-5 sm:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <span className="flex items-end gap-[3px]" aria-hidden="true">
              {WORDMARK_BARS.map((height) => (
                <span key={height} className="w-[3px] bg-accent" style={{ height }} />
              ))}
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
              Avaliação de Produtos
            </span>
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-medium text-ink/65 underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Produtos
            </Link>
            {isAdmin(account) && (
              <Link
                href="/products/new"
                className="text-sm font-medium text-ink/65 underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                Novo produto
              </Link>
            )}
          </nav>
        </div>

        {account ? (
          <UserMenu account={account} />
        ) : (
          <Button
            asChild
            size="sm"
            className="h-9 rounded-none bg-brand px-4 font-semibold text-paper hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <Link href={signInHref}>Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
