import { HelperText } from '@cognite/aura/components/helper-text';
import { cn } from '@cognite/aura/utils';
import type { ComponentProps } from 'react';

import { useAlertDialogContext } from './alertDialogContext';

export type AlertDialogFooterProps = ComponentProps<'div'>;

/**
 * The actions of an alert dialog: cancel first, the confirming action last. When the confirming
 * action fails, the error is announced above the buttons and the dialog stays open for a retry.
 */
export function AlertDialogFooter({ className, children, ...props }: AlertDialogFooterProps) {
  const { error } = useAlertDialogContext();

  return (
    <div data-slot="alert-dialog-footer" className="flex flex-col pt-3">
      {error ? (
        <HelperText isError role="alert">
          {error}
        </HelperText>
      ) : null}
      <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props}>
        {children}
      </div>
    </div>
  );
}
