import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { cn } from '@cognite/aura/utils';

import { CONTEXT_MENU_ITEM, CONTEXT_MENU_ITEM_DESTRUCTIVE, CONTEXT_MENU_ITEM_INSET } from './contextMenuClasses';

export type ContextMenuItemProps = Omit<ContextMenuPrimitive.Item.Props, 'className'> & {
  /** `destructive` for the one action that deletes or removes. Keep it last, after a separator. */
  variant?: 'default' | 'destructive';
  /** Aligns the label with items that have an icon or a check mark. */
  inset?: boolean;
  /**
   * Disables the item and says why on a second line. Prefer it over hiding the item, so the
   * menu keeps its shape and people learn what would enable the action.
   */
  disabledReason?: string;
  /** Layout classes only. */
  className?: string;
};

/** One action in a context menu: an optional leading icon, a verb + object label, a shortcut. */
export function ContextMenuItem({
  variant = 'default',
  inset = false,
  disabled,
  disabledReason,
  className,
  children,
  ...props
}: ContextMenuItemProps) {
  const hasReason = disabledReason !== undefined && disabledReason !== '';

  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      disabled={disabled || hasReason}
      className={cn(
        CONTEXT_MENU_ITEM,
        variant === 'destructive' ? CONTEXT_MENU_ITEM_DESTRUCTIVE : '',
        inset ? CONTEXT_MENU_ITEM_INSET : '',
        className
      )}
      {...props}
    >
      {hasReason ? (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">{children}</span>
          <span data-slot="context-menu-item-reason" className="text-xs leading-4 font-normal">
            {disabledReason}
          </span>
        </span>
      ) : (
        children
      )}
    </ContextMenuPrimitive.Item>
  );
}
