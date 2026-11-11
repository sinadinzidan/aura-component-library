import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { cn } from '@cognite/aura/utils';

export type AlertDialogDescriptionProps = AlertDialogPrimitive.Description.Props;

/** The consequence and whether it can be undone: what is lost or affected, then reversibility. */
export function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-base leading-5 font-normal tracking-tightest text-muted-foreground', className)}
      {...props}
    />
  );
}
