import { useState } from 'react';
import type { ReactNode } from 'react';

/** Spread on the trigger so it toggles the panel and reports its state. */
export type MenuPanelTriggerProps = {
  'aria-expanded': boolean;
  onClick: () => void;
};

type MenuPanelProps = {
  /** Accessible name of the menu surface, for example "Account menu". */
  label: string;
  /** Renders the control the menu belongs to. Spread the props on it; it sits above the panel. */
  trigger?: (props: MenuPanelTriggerProps) => ReactNode;
  /** The panel starts open, which is the point of drawing it in place. */
  defaultOpen?: boolean;
  /** Which edge of the trigger the panel lines up with. */
  align?: 'start' | 'end';
  /** `sm` for plain actions, `md` for rows with descriptions, `lg` for lists, `full` for mega menus. */
  width?: 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode;
};

const WIDTH: Record<NonNullable<MenuPanelProps['width']>, string> = {
  sm: 'w-56',
  md: 'w-72',
  lg: 'w-96',
  full: 'w-full',
};

/**
 * A menu drawn open and in place: the popover surface (background, outline, radius, elevation)
 * without the overlay behaviour, under a trigger that shows and hides it. For documentation,
 * design review and always-visible panels. In a product, put the same content in
 * `DropdownMenuContent` or `PopoverContent`, which add positioning, dismissal and focus handling.
 */
export function MenuPanel({ label, trigger, defaultOpen = true, align = 'start', width = 'sm', children }: MenuPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      data-slot="menu-panel"
      className={`flex max-w-full flex-col gap-1 ${width === 'full' ? 'w-full' : ''} ${align === 'end' ? 'items-end' : 'items-start'}`}
    >
      {trigger?.({ 'aria-expanded': open, onClick: () => setOpen((current) => !current) })}
      {open ? (
        <div
          role="group"
          aria-label={label}
          className={`max-w-full overflow-hidden rounded-xl border border-default bg-popover-background text-popover-foreground shadow-md has-[:focus-visible]:shadow-focus-ring ${WIDTH[width]}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
