import { cn } from '@cognite/aura/utils';
import type { ComponentProps } from 'react';

export type AlertDialogHeaderProps = ComponentProps<'div'>;

/** Groups the title and the description of an alert dialog. */
export function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return <div data-slot="alert-dialog-header" className={cn('flex flex-col gap-2 pb-2', className)} {...props} />;
}
