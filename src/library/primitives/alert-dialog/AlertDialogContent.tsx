import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { usePortalContainer } from '@cognite/aura/components/portal-container-context';
import { cn } from '@cognite/aura/utils';
import type { ReactNode } from 'react';

import { useAlertDialogContext } from './alertDialogContext';

export type AlertDialogContentProps = Omit<AlertDialogPrimitive.Popup.Props, 'className'> & {
  /** `sm` for a sentence and two buttons; `md` when there is a consequence list or a field. */
  size?: 'sm' | 'md';
  /** Layout classes only. */
  className?: string;
  children: ReactNode;
};

const SIZE = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
} as const;

/**
 * The alert dialog surface, centred over a scrim. There is no close button and an outside press
 * does nothing: the only ways out are the actions in the footer and Escape, which cancels.
 * Focus starts on the typed-confirmation field when there is one, otherwise on the cancel
 * action, so Enter never confirms by accident.
 */
export function AlertDialogContent({ size = 'md', className, children, ...props }: AlertDialogContentProps) {
  const container = usePortalContainer();
  const { tone, pending, inputRef, cancelRef } = useAlertDialogContext();

  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" container={container}>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100 motion-reduce:transition-none"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-tone={tone}
        aria-busy={pending || undefined}
        initialFocus={() => inputRef.current ?? cancelRef.current ?? true}
        className={cn(
          'fixed inset-x-4 top-1/2 z-50 grid -translate-y-1/2 rounded-xl border border-default bg-popover-background px-5 py-5 shadow-xl outline-none transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100 motion-reduce:transition-none sm:inset-x-0 sm:left-1/2 sm:w-full sm:-translate-x-1/2',
          SIZE[size],
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}
