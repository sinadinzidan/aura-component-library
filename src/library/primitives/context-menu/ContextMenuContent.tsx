import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { usePortalContainer } from '@cognite/aura/components/portal-container-context';
import { cn } from '@cognite/aura/utils';

import { CONTEXT_MENU_POPUP } from './contextMenuClasses';

export type ContextMenuContentProps = Omit<ContextMenuPrimitive.Popup.Props, 'className'> & {
  /** Layout classes only, such as a width. */
  className?: string;
};

/**
 * The menu surface. It is positioned at the pointer (or the focused element for a keyboard
 * open), flips to stay inside the viewport and scrolls when it runs out of height.
 */
export function ContextMenuContent({ className, ...props }: ContextMenuContentProps) {
  const container = usePortalContainer();

  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" container={container}>
      <ContextMenuPrimitive.Positioner className="isolate z-50 outline-none">
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn(CONTEXT_MENU_POPUP, className)}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}
