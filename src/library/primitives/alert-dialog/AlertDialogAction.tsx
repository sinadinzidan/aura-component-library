import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import type { ReactNode } from 'react';

import { useAlertDialogContext } from './alertDialogContext';

export type AlertDialogActionProps = {
  /** The specific action, such as "Delete pipeline". Never "OK", "Yes" or "Confirm". */
  children: ReactNode;
  /**
   * Runs the action. May return a promise: the dialog then stays open, busy and undismissable
   * until it settles, closes on success and shows `errorMessage` on failure.
   */
  onConfirm?: () => void | Promise<void>;
  /** Label while the action is in flight, such as "Deleting…". */
  pendingLabel?: string;
  /** Shown above the buttons when `onConfirm` rejects. Say what happened and what to do. */
  errorMessage?: string;
  /** An extra condition on top of the dialog's typed-confirmation and acknowledgement gates. */
  disabled?: boolean;
};

/**
 * The confirming action. It takes the destructive button when the dialog's tone is destructive,
 * stays locked until every typed confirmation and required acknowledgement in the dialog is
 * satisfied, and shows a pending state while an asynchronous action runs.
 */
export function AlertDialogAction({
  children,
  onConfirm,
  pendingLabel,
  errorMessage = 'Something went wrong. Try again.',
  disabled = false,
}: AlertDialogActionProps) {
  const { tone, pending, unlocked, confirm } = useAlertDialogContext();

  return (
    <Button
      data-slot="alert-dialog-action"
      data-tone={tone}
      variant={tone === 'destructive' ? 'destructive' : 'default'}
      disabled={disabled || !unlocked || pending}
      aria-busy={pending || undefined}
      onClick={() => confirm(onConfirm ?? (() => undefined), errorMessage)}
    >
      {pending ? <Loader size={16} aria-hidden /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
