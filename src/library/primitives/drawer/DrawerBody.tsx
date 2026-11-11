import { cn } from '@cognite/aura/utils';
import type { ComponentProps } from 'react';

export type DrawerBodyProps = ComponentProps<'div'> & {
  /** Removes the padding, for flush lists, tables and tab panels that bring their own. */
  flush?: boolean;
};

/**
 * The part of a drawer that scrolls. Header and footer stay in view; long content scrolls here.
 * It can be focused so the keyboard can scroll it when it holds no controls.
 */
export function DrawerBody({ className, flush = false, ...props }: DrawerBodyProps) {
  return (
    <div
      data-slot="drawer-body"
      tabIndex={-1}
      className={cn('min-h-0 flex-1 overflow-y-auto outline-none', flush ? '' : 'px-5 py-4', className)}
      {...props}
    />
  );
}
