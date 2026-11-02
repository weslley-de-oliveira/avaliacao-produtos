import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignInScreen } from '@/components/auth/sign-in-screen';
import { getSafeRedirectPath } from '@/lib/validations/sign-in';
import { getCurrentAccount } from '@/server/auth/current-account';

export const metadata: Metadata = {
  title: 'Entrar | Avaliação de Produtos',
  description: 'Entre com seu email e senha para avaliar produtos.',
};

type SignInPageProps = {
  searchParams: Promise<{ redirect?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const redirectTo = getSafeRedirectPath(params.redirect);
  const account = await getCurrentAccount();

  if (account) {
    redirect(redirectTo);
  }

  return <SignInScreen redirectTo={redirectTo} />;
}
