import { SignUpForm } from '@/components/auth/sign-up-form';

const RATING_BARS = [8, 12, 16, 20, 24];

export function SignUpScreen() {
  return (
    <main className="min-h-screen bg-paper px-5 py-10 sm:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-20">
        <header className="text-ink">
          <div className="flex items-center gap-3">
            <span className="flex items-end gap-[3px]" aria-hidden="true">
              {RATING_BARS.map((height) => (
                <span key={height} className="w-[3px] bg-accent" style={{ height }} />
              ))}
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Avaliação de Produtos
            </span>
          </div>

          <h1 className="mt-10 max-w-[15ch] text-balance font-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] sm:text-5xl lg:mt-14 lg:text-6xl">
            Avalie o que você usa. Ajude quem está decidindo.
          </h1>

          <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-ink/70 sm:text-lg">
            Crie sua conta para registrar suas avaliações e acompanhar tudo o que você já testou.
          </p>
        </header>

        <SignUpForm />
      </div>
    </main>
  );
}
