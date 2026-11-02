import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10 sm:px-8">
      <div className="relative w-full max-w-md">
        <div
          aria-hidden="true"
          className="ticket-clip absolute inset-0 translate-x-1.5 translate-y-1.5 bg-brand-deep sm:translate-x-2 sm:translate-y-2"
        />

        <Card className="ticket-clip relative rounded-none border border-ink bg-paper shadow-none">
          <div className="h-2 bg-accent" />

          <CardHeader className="space-y-2 px-6 pb-2 pt-8 sm:px-8 sm:pt-9">
            <CardTitle className="font-display text-4xl font-bold leading-none tracking-tight">
              Conta criada
            </CardTitle>
            <CardDescription className="text-base leading-relaxed text-ink/65">
              Tudo pronto. Sua conta está ativa e você já pode avaliar produtos.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8 pt-6 sm:px-8 sm:pb-9">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-none text-base font-semibold hover:bg-brand-deep"
            >
              <Link href="/">Voltar para o início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
