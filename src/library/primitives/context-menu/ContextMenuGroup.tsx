import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';

export type ContextMenuGroupProps = ContextMenuPrimitive.Group.Props;

/** A set of related items, named by a `ContextMenuLabel` inside it. */
export function ContextMenuGroup(props: ContextMenuGroupProps) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}
