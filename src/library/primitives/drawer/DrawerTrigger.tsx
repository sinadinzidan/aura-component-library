import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

export type DrawerTriggerProps = DialogPrimitive.Trigger.Props;

/**
 * The control that opens the drawer. Pass an Aura `Button` through `render`. Focus returns to it
 * when the drawer closes.
 */
export function DrawerTrigger(props: DrawerTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}
