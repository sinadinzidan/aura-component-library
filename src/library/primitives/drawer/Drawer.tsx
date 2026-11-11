import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { DrawerContext } from './drawerContext';

export type DrawerProps = {
  /** Controlled open state. Leave out, with `defaultOpen`, for an uncontrolled drawer. */
  open?: boolean;
  defaultOpen?: boolean;
  /**
   * Called for every open or close request. Call `details.cancel()` to veto one in an
   * uncontrolled drawer; in a controlled drawer simply do not update `open`.
   */
  onOpenChange?: DialogPrimitive.Root.Props['onOpenChange'];
  /** Called when the open or close animation has finished. */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * `true` (default): scrim, focus trap, page scroll lock, closes on outside press.
   * `false`: no scrim, the page stays usable, the drawer stays open until closed explicitly.
   */
  modal?: boolean;
  /**
   * `false` blocks Escape, the scrim and every `DrawerClose`, for the seconds a save is in
   * flight. Say why in the drawer; never leave a drawer undismissable at rest.
   */
  dismissible?: boolean;
  children: ReactNode;
};

/**
 * Root of a drawer: a secondary surface that slides in from an edge for filters, the detail of a
 * selected record or a medium-length form. Holds the open state and shares the modal and
 * dismissible settings with its parts. Renders no element of its own.
 */
export function Drawer({
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
  dismissible = true,
  children,
}: DrawerProps) {
  const context = useMemo(() => ({ modal, dismissible }), [modal, dismissible]);

  const changeOpen: DialogPrimitive.Root.Props['onOpenChange'] = (next, details) => {
    if (!next && !dismissible) {
      details.cancel();
      return;
    }
    onOpenChange?.(next, details);
  };

  return (
    <DrawerContext.Provider value={context}>
      <DialogPrimitive.Root
        data-slot="drawer"
        open={open}
        defaultOpen={defaultOpen}
        modal={modal}
        disablePointerDismissal={!modal}
        onOpenChange={changeOpen}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        {children}
      </DialogPrimitive.Root>
    </DrawerContext.Provider>
  );
}
