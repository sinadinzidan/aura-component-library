import { Button } from '@cognite/aura/components/button';
import { IconCircleCheck, IconCircleDashed, IconCircleX } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

export type SignOffState = 'signed' | 'pending' | 'declined';

export type SignOffSigner = {
  id: string;
  /** What they sign as, e.g. "Shift supervisor". */
  role: string;
  /** Left out while nobody is assigned. */
  name?: string;
  state: SignOffState;
  /** When they signed or declined, e.g. "12 Mar, 14:02". */
  at?: string;
};

export type SignOffBlockProps = {
  signers: readonly SignOffSigner[];
  /** What is being signed, e.g. "Sign-off, morning round". */
  label: string;
  /** The signer who can sign here. They get a button instead of "Pending". */
  currentSignerId?: string;
  onSign?: (signerId: string) => void;
  signLabel?: string;
  className?: string;
};

const ICON = { signed: IconCircleCheck, pending: IconCircleDashed, declined: IconCircleX } as const;
const ICON_TONE: Record<SignOffState, string> = {
  signed: 'text-success-foreground-strong',
  pending: 'text-muted-foreground',
  declined: 'text-critical-foreground-strong',
};
const WORD: Record<SignOffState, string> = { signed: 'Signed', pending: 'Pending', declined: 'Declined' };

/**
 * Who has to sign and who has: one row per role with name, state and time. The current user's own
 * pending row carries the sign button, so signing happens where the state is shown.
 */
export function SignOffBlock({ signers, label, currentSignerId, onSign, signLabel = 'Sign off', className }: SignOffBlockProps) {
  return (
    <ul data-slot="sign-off" aria-label={label} className={cn('flex w-full flex-col gap-3', className)}>
      {signers.map((signer) => {
        const Icon = ICON[signer.state];
        const canSign = signer.state === 'pending' && signer.id === currentSignerId && onSign !== undefined;
        return (
          <li key={signer.id} data-state={signer.state} className="flex min-h-9 items-center gap-3">
            <Icon aria-hidden className={cn('size-5 shrink-0', ICON_TONE[signer.state])} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{signer.name ?? 'Not assigned'}</span>
              <span className="truncate text-xs text-muted-foreground">{signer.role}</span>
            </div>
            {canSign ? (
              <Button size="sm" onClick={() => onSign(signer.id)}>
                {signLabel}
              </Button>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {WORD[signer.state]}
                {signer.at && signer.state !== 'pending' ? ` ${signer.at}` : null}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
