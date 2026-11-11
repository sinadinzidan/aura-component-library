import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { Button } from '@cognite/aura/components/button';
import type { ReactNode } from 'react';

import { useAlertDialogContext } from './alertDialogContext';

export type AlertDialogCancelProps = {
  /** Usually "Cancel"; name what is kept when that is clearer, such as "Keep editing". */
  children?: ReactNode;
  onClick?: () => void;
};

/**
 * The safe way out. It receives focus when the dialog opens, so Enter and Escape both leave
 * things as they were. Disabled while the confirming action is in flight.
 */
export function AlertDialogCancel({ children = 'Cancel', onClick }: AlertDialogCancelProps) {
  const { pending, cancelRef } = useAlertDialogContext();

  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      disabled={pending}
      onClick={onClick}
      render={<Button ref={cancelRef} variant="ghost" />}
    >
      {children}
    </AlertDialogPrimitive.Close>
  );
}
