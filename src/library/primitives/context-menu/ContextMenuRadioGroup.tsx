import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';

export type ContextMenuRadioGroupProps = ContextMenuPrimitive.RadioGroup.Props;

/** Groups `ContextMenuRadioItem`s that share one value, such as a sort order or a row density. */
export function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}
