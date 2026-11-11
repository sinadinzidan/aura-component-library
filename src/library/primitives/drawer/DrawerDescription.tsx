import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@cognite/aura/utils';

export type DrawerDescriptionProps = DialogPrimitive.Description.Props;

/** One quiet line under the title: the record's tag, or what the drawer is for. */
export function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm leading-5 font-normal text-muted-foreground', className)}
      {...props}
    />
  );
}
