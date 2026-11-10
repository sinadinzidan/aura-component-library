import type { ReactNode } from 'react';

type SidebarProps = {
  /** Accessible name of the region, for example "Sidebar" or "Filters". */
  label: string;
  /** Pinned to the top: product mark, workspace switcher, search. */
  header?: ReactNode;
  /** The scrolling middle, usually a `SidebarNav`. */
  children: ReactNode;
  /** Pinned to the bottom: user, help, collapse toggle. */
  footer?: ReactNode;
  /** `dark` is the fixed-dark shell surface and stays dark in both themes. */
  tone?: 'light' | 'dark';
  /** Narrow icon rail. Pass the same flag to `SidebarNav`. */
  collapsed?: boolean;
  /** Which edge carries the rule: `left` sidebars draw it on the right, and the reverse. */
  side?: 'left' | 'right';
};

const SURFACE = {
  light: { root: 'border-default bg-base-background text-base-foreground', rule: 'border-default' },
  dark: {
    root: 'border-secondary-background-hover-fixed-dark bg-popover-background-fixed-dark text-popover-foreground-fixed-dark',
    rule: 'border-secondary-background-hover-fixed-dark',
  },
} as const;

/**
 * The frame of an in-app sidebar: a header and footer that stay put and a middle that scrolls,
 * at the standard 240px width or as a narrow rail. It takes the height of its container.
 */
export function Sidebar({
  label,
  header,
  children,
  footer,
  tone = 'light',
  collapsed = false,
  side = 'left',
}: SidebarProps) {
  const surface = SURFACE[tone];

  return (
    <aside
      data-slot="sidebar"
      data-tone={tone}
      aria-label={label}
      className={`flex h-full shrink-0 flex-col ${side === 'left' ? 'border-r' : 'border-l'} ${surface.root} ${collapsed ? 'w-14' : 'w-60'}`}
    >
      {header ? <div className={`shrink-0 border-b p-2 ${surface.rule}`}>{header}</div> : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>
      {footer ? <div className={`shrink-0 border-t p-2 ${surface.rule}`}>{footer}</div> : null}
    </aside>
  );
}
