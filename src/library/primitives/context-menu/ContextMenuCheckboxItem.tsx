import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { IconCheck } from '@cognite/aura/icons';
import { cn } from '@cognite/aura/utils';

import { CONTEXT_MENU_INDICATOR_SLOT, CONTEXT_MENU_ITEM, CONTEXT_MENU_ITEM_INSET } from './contextMenuClasses';

export type ContextMenuCheckboxItemProps = Omit<ContextMenuPrimitive.CheckboxItem.Props, 'className'> & {
  /** Layout classes only. */
  className?: string;
};

/**
 * A toggle inside a context menu, for independent on/off options such as visible columns. The
 * menu stays open after a toggle so several can be changed in one visit.
 */
export function ContextMenuCheckboxItem({
  className,
  children,
  closeOnClick = false,
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      closeOnClick={closeOnClick}
      className={cn(CONTEXT_MENU_ITEM, CONTEXT_MENU_ITEM_INSET, className)}
      {...props}
    >
      <span className={CONTEXT_MENU_INDICATOR_SLOT}>
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <IconCheck className="size-4" />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}
