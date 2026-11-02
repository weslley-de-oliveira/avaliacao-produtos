'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PasswordInput } from '@/components/auth/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type SignInInput, signInSchema } from '@/lib/validations/sign-in';
import { api } from '@/trpc/client';

const INVALID_CREDENTIALS = 'Email ou senha inválidos.';
const GENERIC_ERROR = 'Não foi possível entrar agora. Tente novamente.';

type SignInFormProps = {
  redirectTo: string;
};

export function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signIn = api.auth.signIn.useMutation({
    onSuccess: () => {
      router.push(redirectTo);
      router.refresh();
    },
    onError: (mutationError) => {
      setError(mutationError.data?.code === 'UNAUTHORIZED' ? INVALID_CREDENTIALS : GENERIC_ERROR);
    },
  });

  const onSubmit = (data: SignInInput) => {
    setError('');
    signIn.mutate(data);
  };

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      <div
        aria-hidden="true"
        className="ticket-clip absolute inset-0 translate-x-1.5 translate-y-1.5 bg-brand-deep sm:translate-x-2 sm:translate-y-2"
      />

      <Card className="ticket-clip relative rounded-none border border-ink bg-paper shadow-none">
        <div className="h-2 bg-accent" />

        <CardHeader className="space-y-1.5 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
          <CardTitle className="font-display text-3xl font-bold tracking-tight">Entrar</CardTitle>
          <CardDescription className="text-sm text-ink/60">
            Use seu email e senha para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 pt-0 sm:px-8 sm:pb-9">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {error && (
                <Alert
                  className="rounded-none border-0 bg-destructive px-4 py-3 text-destructive-foreground"
                  aria-live="assertive"
                >
                  <AlertTitle>Não foi possível entrar</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-ink/70">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="maria@exemplo.com"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          clearError();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-ink/70">Senha</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="current-password"
                        placeholder="Sua senha"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          clearError();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-none bg-brand text-base font-semibold text-paper hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                disabled={signIn.isPending}
              >
                {signIn.isPending ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-sm text-ink/60">
            Ainda não tem conta?{' '}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-brand underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
