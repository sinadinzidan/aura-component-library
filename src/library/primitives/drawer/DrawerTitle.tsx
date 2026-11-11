import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@cognite/aura/utils';

export type DrawerTitleProps = DialogPrimitive.Title.Props;

/** Names the drawer for people and for assistive technology. Every drawer needs one. */
export function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-lg leading-6 font-medium tracking-tightest text-base-foreground', className)}
      {...props}
    />
  );
}
