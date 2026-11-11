import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';

export type AlertDialogTriggerProps = AlertDialogPrimitive.Trigger.Props;

/**
 * The control that opens the alert dialog. Pass an Aura `Button` through `render`; its label ends
 * in an ellipsis-free verb and object, such as "Delete pipeline". Focus returns to it on close.
 */
export function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}
