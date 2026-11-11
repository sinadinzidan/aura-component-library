import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Button } from '@cognite/aura/components/button';
import { usePortalContainer } from '@cognite/aura/components/portal-container-context';
import { IconX } from '@cognite/aura/icons';
import { cn } from '@cognite/aura/utils';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { useDrawerContext } from './drawerContext';

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export type DrawerContentProps = Omit<DialogPrimitive.Popup.Props, 'className'> & {
  /** The edge the drawer is attached to. Detail and filters go right; navigation goes left. */
  side?: DrawerSide;
  /** Width for left and right drawers, height for top and bottom ones. */
  size?: DrawerSize;
  /**
   * Renders the drawer in place, as a column of the surrounding flex row, instead of over the
   * page. Use with `modal={false}` for an inspector that sits beside the content.
   */
  docked?: boolean;
  /** Hides the built-in close button; provide another `DrawerClose` in that case. */
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  /** Layout classes only. */
  className?: string;
  children: ReactNode;
};

const SIDE_POSITION: Record<DrawerSide, string> = {
  right: 'inset-y-0 right-0 h-full max-w-full border-l',
  left: 'inset-y-0 left-0 h-full max-w-full border-r',
  top: 'inset-x-0 top-0 w-full max-h-full rounded-b-xl border-b',
  bottom: 'inset-x-0 bottom-0 w-full max-h-full rounded-t-xl border-t',
};

const SIDE_MOTION: Record<DrawerSide, string> = {
  right:
    'data-starting-style:translate-x-full data-ending-style:translate-x-full data-nested-dialog-open:-translate-x-6',
  left: 'data-starting-style:-translate-x-full data-ending-style:-translate-x-full data-nested-dialog-open:translate-x-6',
  top: 'data-starting-style:-translate-y-full data-ending-style:-translate-y-full',
  bottom: 'data-starting-style:translate-y-full data-ending-style:translate-y-full',
};

const SIDE_DOCK: Record<DrawerSide, string> = {
  right: 'h-full max-w-full border-l',
  left: 'h-full max-w-full border-r',
  top: 'w-full max-h-full border-b',
  bottom: 'w-full max-h-full border-t',
};

const WIDTH: Record<DrawerSize, string> = {
  sm: 'w-80',
  md: 'w-md',
  lg: 'w-2xl',
  full: 'w-full',
};

const HEIGHT: Record<DrawerSize, string> = {
  sm: 'h-56',
  md: 'h-96',
  lg: 'h-3/4',
  full: 'h-full',
};

function isHorizontal(side: DrawerSide): boolean {
  return side === 'left' || side === 'right';
}

/**
 * The drawer surface. Modal drawers render over the page behind a scrim, trap focus, close on
 * Escape or a press on the scrim, and hand focus back to the trigger. Docked drawers render in
 * place as a column or row of their container. The slide is skipped under reduced motion.
 */
export function DrawerContent({
  side = 'right',
  size = 'md',
  docked = false,
  showCloseButton = true,
  closeButtonLabel = 'Close',
  className,
  children,
  ...props
}: DrawerContentProps) {
  const { modal, dismissible } = useDrawerContext();
  const overlayContainer = usePortalContainer();
  const [dock, setDock] = useState<HTMLElement | null>(null);
  const extent = isHorizontal(side) ? WIDTH[size] : HEIGHT[size];

  const popup = (
    <DialogPrimitive.Popup
      data-slot="drawer-content"
      data-side={side}
      data-size={size}
      data-docked={docked ? '' : undefined}
      className={cn(
        'flex flex-col border-default bg-popover-background text-popover-foreground outline-none',
        extent,
        docked
          ? cn('relative shrink-0', SIDE_DOCK[side])
          : cn(
              'fixed z-50 transition-transform duration-200 ease-out motion-reduce:transition-none',
              SIDE_POSITION[side],
              SIDE_MOTION[side],
              modal ? 'shadow-xl' : 'shadow-lg'
            ),
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close
          data-slot="drawer-close"
          disabled={!dismissible}
          render={
            <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label={closeButtonLabel}>
              <IconX />
            </Button>
          }
        />
      ) : null}
    </DialogPrimitive.Popup>
  );

  if (docked) {
    return (
      <>
        <div ref={setDock} data-slot="drawer-dock" className="contents" />
        {dock ? <DialogPrimitive.Portal container={dock} className="contents">{popup}</DialogPrimitive.Portal> : null}
      </>
    );
  }

  return (
    <DialogPrimitive.Portal data-slot="drawer-portal" container={overlayContainer}>
      {modal ? (
        <DialogPrimitive.Backdrop
          data-slot="drawer-overlay"
          className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100 data-starting-style:opacity-0 motion-reduce:transition-none"
        />
      ) : null}
      {popup}
    </DialogPrimitive.Portal>
  );
}
