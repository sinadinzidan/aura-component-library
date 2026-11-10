import type { ReactNode } from 'react';

type MenuPanelProps = {
  /** Accessible name of the menu surface, for example "Account menu". */
  label: string;
  /** The control the menu belongs to, shown above the panel in its open state. */
  trigger?: ReactNode;
  /** Which edge of the trigger the panel lines up with. */
  align?: 'start' | 'end';
  /** Menu width. `sm` for plain actions, `md` for rows with descriptions, `lg` for lists. */
  width?: 'sm' | 'md' | 'lg';
  children: ReactNode;
};

const WIDTH: Record<NonNullable<MenuPanelProps['width']>, string> = {
  sm: 'w-56',
  md: 'w-72',
  lg: 'w-96',
};

/**
 * A menu drawn open and in place: the popover surface (background, outline, radius, elevation)
 * without the overlay behaviour, with its trigger above it. For documentation, design review and
 * always-visible panels. In a product, put the same content in `DropdownMenuContent` or
 * `PopoverContent`, which add positioning, dismissal and focus handling.
 */
export function MenuPanel({ label, trigger, align = 'start', width = 'sm', children }: MenuPanelProps) {
  return (
    <div data-slot="menu-panel" className={`flex max-w-full flex-col gap-1 ${align === 'end' ? 'items-end' : 'items-start'}`}>
      {trigger}
      <div
        role="group"
        aria-label={label}
        className={`max-w-full overflow-hidden rounded-xl border border-default bg-popover-background text-popover-foreground shadow-md ${WIDTH[width]}`}
      >
        {children}
      </div>
    </div>
  );
}
