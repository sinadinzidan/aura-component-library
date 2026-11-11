import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { cn, menuSectionSeparatorClasses } from '@cognite/aura/utils';

export type ContextMenuSeparatorProps = ContextMenuPrimitive.Separator.Props;

/** A full-width line between sections of a context menu. */
export function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(menuSectionSeparatorClasses, className)}
      {...props}
    />
  );
}
