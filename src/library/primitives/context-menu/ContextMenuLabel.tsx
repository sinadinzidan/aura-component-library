import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { cn, menuSectionLabelClasses } from '@cognite/aura/utils';

export type ContextMenuLabelProps = Omit<ContextMenuPrimitive.GroupLabel.Props, 'className'> & {
  /** Aligns the label with inset items. */
  inset?: boolean;
  /** Layout classes only. */
  className?: string;
};

/**
 * The heading of a `ContextMenuGroup`. Also the place to name the target ("23-KA-9101") so the
 * menu says what it acts on. Must be rendered inside a `ContextMenuGroup`.
 */
export function ContextMenuLabel({ inset = false, className, ...props }: ContextMenuLabelProps) {
  return (
    <ContextMenuPrimitive.GroupLabel
      data-slot="context-menu-label"
      className={cn(menuSectionLabelClasses, inset ? 'pl-8' : '', className)}
      {...props}
    />
  );
}
