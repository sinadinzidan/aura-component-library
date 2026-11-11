import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';

export type ContextMenuProps = ContextMenuPrimitive.Root.Props;

/**
 * Root of a context menu: the actions for the thing under the pointer. It opens on right-click,
 * on a long press and on Shift+F10 or the context-menu key, at the pointer or the focused
 * element. Every action in it must also be reachable from visible UI.
 */
export function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}
