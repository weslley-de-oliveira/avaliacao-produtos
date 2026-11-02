import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { getCurrentAccount } from '@/server/auth/current-account';
import { Providers } from '@/trpc/provider';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Módulo de Engajamento - Avaliação de Produtos',
  description: 'Sistema de avaliação de produtos',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = await getCurrentAccount();

  return (
    <html lang="pt-BR">
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>
        <Providers>
          <SiteHeader account={account} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
