import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { IconCheck } from '@cognite/aura/icons';
import { cn } from '@cognite/aura/utils';

import { CONTEXT_MENU_INDICATOR_SLOT, CONTEXT_MENU_ITEM, CONTEXT_MENU_ITEM_INSET } from './contextMenuClasses';

export type ContextMenuRadioItemProps = Omit<ContextMenuPrimitive.RadioItem.Props, 'className'> & {
  /** Layout classes only. */
  className?: string;
};

/** One of several mutually exclusive options inside a `ContextMenuRadioGroup`. */
export function ContextMenuRadioItem({ className, children, ...props }: ContextMenuRadioItemProps) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(CONTEXT_MENU_ITEM, CONTEXT_MENU_ITEM_INSET, className)}
      {...props}
    >
      <span className={CONTEXT_MENU_INDICATOR_SLOT}>
        <ContextMenuPrimitive.RadioItemIndicator>
          <IconCheck className="size-4" />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}
