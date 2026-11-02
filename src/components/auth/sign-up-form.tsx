'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { type SignUpInput, signUpSchema } from '@/lib/validations/sign-up';
import { api } from '@/trpc/client';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const createAccount = api.auth.signUp.useMutation({
    onSuccess: () => {
      router.push('/auth/sign-up/success');
    },
    onError: (mutationError) => {
      const fieldErrors = mutationError.data?.zodError?.fieldErrors;
      const firstFieldError = fieldErrors
        ? Object.values(fieldErrors)
            .flat()
            .find((message) => Boolean(message))
        : undefined;

      setError(firstFieldError ?? mutationError.message ?? 'Erro ao criar conta');
    },
  });

  const onSubmit = (data: SignUpInput) => {
    setError('');
    createAccount.mutate(data);
  };

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="ticket-clip absolute inset-0 translate-x-1.5 translate-y-1.5 bg-brand-deep sm:translate-x-2 sm:translate-y-2"
      />

      <Card className="ticket-clip relative rounded-none border border-ink bg-paper shadow-none">
        <div className="h-2 bg-accent" />

        <CardHeader className="space-y-1.5 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
          <CardTitle className="font-display text-3xl font-bold tracking-tight">
            Criar conta
          </CardTitle>
          <CardDescription className="text-sm text-ink/60">
            Leva menos de um minuto.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 pt-0 sm:px-8 sm:pb-9">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {error && (
                <Alert className="rounded-none border-0 bg-destructive px-4 py-3 text-destructive-foreground">
                  <AlertTitle>Não foi possível criar a conta</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-ink/70">Nome</FormLabel>
                      <FormControl>
                        <Input autoComplete="given-name" placeholder="Maria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-ink/70">Sobrenome</FormLabel>
                      <FormControl>
                        <Input autoComplete="family-name" placeholder="Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mínimo de 6 caracteres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-ink/70">Confirmação de senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-none text-base font-semibold hover:bg-brand-deep"
                disabled={createAccount.isPending}
              >
                {createAccount.isPending ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
