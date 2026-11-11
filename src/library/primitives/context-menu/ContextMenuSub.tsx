import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';

export type ContextMenuSubProps = ContextMenuPrimitive.SubmenuRoot.Props;

/** Root of a submenu. Keep menus to one level of nesting. */
export function ContextMenuSub(props: ContextMenuSubProps) {
  return <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />;
}
