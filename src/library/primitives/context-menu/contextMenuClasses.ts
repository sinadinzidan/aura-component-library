import { cn, menuContainerPadding, menuItemPadding } from '@cognite/aura/utils';

/** Class strings shared by the context-menu parts. They mirror Aura's dropdown menu. */

export const CONTEXT_MENU_POPUP = cn(
  'z-50 max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-default bg-popover-background shadow-md outline-none',
  'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none',
  menuContainerPadding
);

export const CONTEXT_MENU_ITEM = cn(
  'group/menu-item relative flex min-h-9 cursor-default items-center gap-2 rounded-lg text-sm leading-4.5 font-medium text-popover-foreground outline-hidden select-none',
  'focus:bg-popover-background-hover focus:text-popover-foreground data-highlighted:bg-popover-background-hover',
  'data-disabled:pointer-events-none data-disabled:text-base-foreground-disabled',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-popover-foreground [&_svg:not([class*='size-'])]:size-4 data-disabled:[&_svg]:text-base-foreground-disabled",
  menuItemPadding
);

export const CONTEXT_MENU_ITEM_DESTRUCTIVE =
  'text-critical-foreground-strong focus:text-critical-foreground-strong [&_svg]:text-critical-foreground-strong';

export const CONTEXT_MENU_ITEM_INSET = 'pl-8';

export const CONTEXT_MENU_INDICATOR_SLOT =
  'pointer-events-none absolute left-2 flex size-3.5 items-center justify-center';
