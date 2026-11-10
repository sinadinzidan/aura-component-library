import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type AsyncButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  /** Runs when the button is activated. The button stays busy until the promise settles. */
  onAction: () => Promise<unknown>;
  /** Label shown while busy, for example "Saving…". Falls back to the normal label. */
  pendingLabel?: ReactNode;
};

/**
 * A Button that shows a loader and ignores further clicks while its action is in flight, so a
 * non-idempotent action cannot be submitted twice.
 */
export function AsyncButton({ onAction, pendingLabel, children, ...buttonProps }: AsyncButtonProps) {
  const [pending, setPending] = useState(false);

  const run = () => {
    if (pending) return;
    setPending(true);
    void onAction().then(
      () => setPending(false),
      () => setPending(false)
    );
  };

  return (
    <Button {...buttonProps} aria-busy={pending || undefined} onClick={run}>
      {pending ? <Loader size={16} aria-hidden /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
