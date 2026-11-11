import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { cn } from '@cognite/aura/utils';

export type AlertDialogTitleProps = AlertDialogPrimitive.Title.Props;

/** The question, naming the action and the object: "Delete pipeline?". Never "Are you sure?". */
export function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg leading-6 font-medium tracking-tightest text-base-foreground', className)}
      {...props}
    />
  );
}
