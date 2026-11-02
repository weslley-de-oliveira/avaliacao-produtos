import { SignInForm } from '@/components/auth/sign-in-form';

const WORDMARK_BARS = [8, 12, 16];
const RATING_BARS = [10, 14, 18, 22, 26];

type SignInScreenProps = {
  redirectTo: string;
};

export function SignInScreen({ redirectTo }: SignInScreenProps) {
  return (
    <main className="min-h-screen bg-paper px-5 py-10 sm:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-20">
        <header className="text-ink">
          <div className="flex items-center gap-3">
            <span className="flex items-end gap-[3px]" aria-hidden="true">
              {WORDMARK_BARS.map((height) => (
                <span key={height} className="w-[3px] bg-accent" style={{ height }} />
              ))}
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Avaliação de Produtos
            </span>
          </div>

          <h1 className="mt-10 max-w-[13ch] text-balance font-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] sm:text-5xl lg:mt-14 lg:text-6xl">
            Volte ao que importa.
          </h1>

          <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-ink/70 sm:text-lg">
            Entre para continuar avaliando o que você já testou e ajudar quem ainda está decidindo.
          </p>

          <div className="mt-10 hidden items-center gap-4 lg:flex">
            <span className="flex items-end gap-1.5" aria-hidden="true">
              {RATING_BARS.map((height) => (
                <span key={height} className="w-1.5 bg-accent" style={{ height }} />
              ))}
            </span>
            <span className="max-w-[24ch] text-sm leading-snug text-ink/60">
              Notas de 1 a 5, direto de quem já testou.
            </span>
          </div>
        </header>

        <SignInForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
