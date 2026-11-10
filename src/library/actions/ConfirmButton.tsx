import { Button } from '@cognite/aura/components/button';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type Timers = {
  set: (callback: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
};

const browserTimers: Timers = {
  set: (callback, ms) => window.setTimeout(callback, ms),
  clear: (handle) => {
    if (typeof handle === 'number') window.clearTimeout(handle);
  },
};

type ConfirmButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'variant'> & {
  /** Label once armed, for example "Confirm delete". */
  confirmLabel: ReactNode;
  onConfirm: () => void;
  /** How long the armed state lasts before it resets. */
  resetAfterMs?: number;
  timers?: Timers;
};

/**
 * Two-step destructive action for dense rows where a Dialog would be too heavy: the first click
 * arms the button, the second commits. It disarms on blur or after a short delay.
 */
export function ConfirmButton({
  confirmLabel,
  onConfirm,
  resetAfterMs = 4000,
  timers = browserTimers,
  children,
  ...buttonProps
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const handle = timers.set(() => setArmed(false), resetAfterMs);
    return () => timers.clear(handle);
  }, [armed, resetAfterMs, timers]);

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onConfirm();
  };

  return (
    <Button
      {...buttonProps}
      variant={armed ? 'destructive' : 'ghost'}
      onClick={handleClick}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
