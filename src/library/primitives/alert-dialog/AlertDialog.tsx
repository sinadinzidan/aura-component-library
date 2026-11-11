import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { AlertDialogContext } from './alertDialogContext';
import type { AlertDialogTone } from './alertDialogContext';

export type AlertDialogProps = {
  /** Controlled open state. Leave out, with `defaultOpen`, for an uncontrolled dialog. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `destructive` gives the confirming action the destructive button. */
  tone?: AlertDialogTone;
  children: ReactNode;
};

function isPromise(value: void | Promise<void>): value is Promise<void> {
  return value instanceof Promise;
}

/**
 * Root of an alert dialog: a short interruption that asks for one clear decision before a
 * consequential action. It has `role="alertdialog"`, does not close on an outside press, blocks
 * every way of closing while the action is in flight, and closes itself when the action succeeds.
 */
export function AlertDialog({ open, defaultOpen = false, onOpenChange, tone = 'neutral', children }: AlertDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gates, setGates] = useState<Record<string, boolean>>({});
  const cancelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const isOpen = open ?? internalOpen;

  const changeOpen = useCallback(
    (next: boolean) => {
      if (pendingRef.current) return;
      setError(null);
      setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const setGate = useCallback((id: string, satisfied: boolean | null) => {
    setGates((current) => {
      if (satisfied === null) {
        if (!(id in current)) return current;
        const { [id]: _removed, ...rest } = current;
        return rest;
      }
      return current[id] === satisfied ? current : { ...current, [id]: satisfied };
    });
  }, []);

  const confirm = useCallback(
    (action: () => void | Promise<void>, errorMessage: string) => {
      if (pendingRef.current) return;
      setError(null);
      const result = action();
      if (!isPromise(result)) {
        changeOpen(false);
        return;
      }
      pendingRef.current = true;
      setPending(true);
      result.then(
        () => {
          pendingRef.current = false;
          setPending(false);
          changeOpen(false);
        },
        () => {
          pendingRef.current = false;
          setPending(false);
          setError(errorMessage);
        }
      );
    },
    [changeOpen]
  );

  const unlocked = Object.values(gates).every(Boolean);
  const context = useMemo(
    () => ({ tone, pending, error, unlocked, setGate, confirm, cancelRef, inputRef }),
    [tone, pending, error, unlocked, setGate, confirm]
  );

  return (
    <AlertDialogContext.Provider value={context}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        open={isOpen}
        onOpenChange={(next, details) => {
          if (pendingRef.current) {
            details.cancel();
            return;
          }
          changeOpen(next);
        }}
      >
        {children}
      </AlertDialogPrimitive.Root>
    </AlertDialogContext.Provider>
  );
}
