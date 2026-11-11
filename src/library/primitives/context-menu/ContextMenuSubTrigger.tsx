import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { IconChevronRight } from '@cognite/aura/icons';
import { cn } from '@cognite/aura/utils';

import { CONTEXT_MENU_ITEM, CONTEXT_MENU_ITEM_INSET } from './contextMenuClasses';

export type ContextMenuSubTriggerProps = Omit<ContextMenuPrimitive.SubmenuTrigger.Props, 'className'> & {
  inset?: boolean;
  /** Layout classes only. */
  className?: string;
};

/** The item that opens a submenu, on hover, on click or with the right arrow key. */
export function ContextMenuSubTrigger({ inset = false, className, children, ...props }: ContextMenuSubTriggerProps) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      className={cn(
        CONTEXT_MENU_ITEM,
        'data-popup-open:bg-popover-background-hover',
        inset ? CONTEXT_MENU_ITEM_INSET : '',
        className
      )}
      {...props}
    >
      {children}
      <IconChevronRight className="ml-auto size-4" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}
