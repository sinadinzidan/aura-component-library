import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import { useDrawerContext } from './drawerContext';

export type DrawerCloseProps = DialogPrimitive.Close.Props;

/**
 * Closes the drawer. Pass an Aura `Button` through `render` for footer actions such as "Cancel".
 * Disabled while the drawer is not dismissible.
 */
export function DrawerClose({ disabled, ...props }: DrawerCloseProps) {
  const { dismissible } = useDrawerContext();
  return <DialogPrimitive.Close data-slot="drawer-close" disabled={disabled || !dismissible} {...props} />;
}
