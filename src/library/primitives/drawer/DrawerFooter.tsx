import { cn } from '@cognite/aura/utils';
import type { ComponentProps } from 'react';

export type DrawerFooterProps = ComponentProps<'div'>;

/**
 * The actions of a drawer. Stays in view under the scrolling body, so "Save" is never below the
 * fold. Secondary action first, primary action last.
 */
export function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-default px-5 py-3',
        className
      )}
      {...props}
    />
  );
}
