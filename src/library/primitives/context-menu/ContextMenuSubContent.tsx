import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { usePortalContainer } from '@cognite/aura/components/portal-container-context';
import { cn } from '@cognite/aura/utils';

import { CONTEXT_MENU_POPUP } from './contextMenuClasses';

export type ContextMenuSubContentProps = Omit<ContextMenuPrimitive.Popup.Props, 'className'> & {
  /** Layout classes only. */
  className?: string;
};

/** The surface of a submenu, placed beside its trigger. */
export function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps) {
  const container = usePortalContainer();

  return (
    <ContextMenuPrimitive.Portal container={container}>
      <ContextMenuPrimitive.Positioner className="isolate z-50 outline-none" alignOffset={-4} sideOffset={0}>
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-sub-content"
          className={cn(CONTEXT_MENU_POPUP, 'min-w-40', className)}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}
