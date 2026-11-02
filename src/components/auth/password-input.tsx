'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

type PasswordInputProps = React.ComponentPropsWithoutRef<'input'>;

/**
 * Input de senha com botão de mostrar/ocultar.
 *
 * Mantém a mesma aparência do `Input` do design system, mas usa `forwardRef`
 * para continuar compatível com o `FormControl` do react-hook-form.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, disabled, ...props },
  ref,
) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn(
          'flex h-11 w-full rounded-none border border-input bg-paper px-3 py-2 pr-12 text-base shadow-none transition-colors placeholder:text-ink/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/50 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
        ) : (
          <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
});

export { PasswordInput };
