import { createContext, useContext } from 'react';
import type { RefObject } from 'react';

export type AlertDialogTone = 'neutral' | 'destructive';

export type AlertDialogContextValue = {
  tone: AlertDialogTone;
  /** True while the confirming action is in flight. Every way of closing is blocked. */
  pending: boolean;
  /** Message of the last failed confirm, or null. */
  error: string | null;
  /** True when every registered gate (typed confirmation, acknowledgement) is satisfied. */
  unlocked: boolean;
  /** A gate reports whether it is satisfied; pass `null` to remove it. */
  setGate: (id: string, satisfied: boolean | null) => void;
  /** Runs the confirming action and closes the dialog when it succeeds. */
  confirm: (action: () => void | Promise<void>, errorMessage: string) => void;
  /** The cancel button, focused first unless a typed confirmation is present. */
  cancelRef: RefObject<HTMLElement>;
  /** The typed-confirmation input, focused first when present. */
  inputRef: RefObject<HTMLInputElement>;
};

export const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

/** Reads the nearest `AlertDialog`. Throws when a part is rendered outside one. */
export function useAlertDialogContext(): AlertDialogContextValue {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialog parts must be rendered inside <AlertDialog>.');
  return context;
}
