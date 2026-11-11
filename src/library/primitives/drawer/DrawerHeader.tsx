import { cn } from '@cognite/aura/utils';
import type { ComponentProps } from 'react';

export type DrawerHeaderProps = ComponentProps<'div'>;

/**
 * The fixed top of a drawer: title, description and, when needed, a status or a row of tabs.
 * Leaves room on the right for the close button.
 */
export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex shrink-0 flex-col gap-1 border-b border-default py-4 pr-14 pl-5', className)}
      {...props}
    />
  );
}
