'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SessionAccount } from '@/lib/auth/session-account';
import { api } from '@/trpc/client';

type UserMenuProps = {
  account: SessionAccount;
};

export function UserMenu({ account }: UserMenuProps) {
  const router = useRouter();
  const [avatarFailed, setAvatarFailed] = useState(false);

  const signOut = api.auth.signOut.useMutation({
    onSuccess: () => {
      router.push('/');
      router.refresh();
    },
  });

  const fullName = `${account.firstName} ${account.lastName}`.trim();
  const initials = `${account.firstName.slice(0, 1)}${account.lastName.slice(0, 1)}`.toUpperCase();
  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    account.email,
  )}&backgroundColor=f5b800`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatarFailed ? (
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-ink/15 bg-accent font-display text-sm font-bold text-paper"
        >
          {initials}
        </span>
      ) : (
        <Image
          src={avatarUrl}
          alt={`Avatar de ${fullName}`}
          width={36}
          height={36}
          unoptimized
          onError={() => setAvatarFailed(true)}
          className="h-9 w-9 shrink-0 border border-ink/15 bg-accent object-cover"
        />
      )}

      <span className="min-w-0 max-w-[7.5rem] leading-tight sm:max-w-[14rem]">
        <span className="block truncate font-display text-sm font-semibold text-ink">
          {fullName}
        </span>
        <span className="block truncate text-xs text-ink/55">{account.email}</span>
      </span>

      <button
        type="button"
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
        className="shrink-0 text-sm font-medium text-ink/60 underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {signOut.isPending ? 'Saindo...' : 'Sair'}
      </button>
    </div>
  );
}
