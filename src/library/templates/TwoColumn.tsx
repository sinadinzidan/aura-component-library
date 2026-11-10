import type { ReactNode } from 'react';

type TwoColumnProps = {
  /** The primary column: what the page is about. */
  children: ReactNode;
  /** The secondary column: properties, people, related records, a summary. */
  aside: ReactNode;
  /** Share of the width the main column takes: two thirds, half or three quarters. */
  ratio?: '2:1' | '1:1' | '3:1';
  /** Which side the secondary column sits on once there is room for two columns. */
  asideSide?: 'end' | 'start';
  /** Keeps the secondary column in view while the main column scrolls. */
  stickyAside?: boolean;
  gap?: 'default' | 'wide';
  /** Accessible name of the secondary column. */
  asideLabel?: string;
};

const GRID = { '2:1': '@3xl:grid-cols-3', '1:1': '@3xl:grid-cols-2', '3:1': '@3xl:grid-cols-4' } as const;
const MAIN = { '2:1': '@3xl:col-span-2', '1:1': '', '3:1': '@3xl:col-span-3' } as const;

/**
 * Main content beside a secondary column, as on a detail page: two thirds and one third by
 * default. The split follows the width of the container, not the screen, so the columns stack
 * with the secondary one underneath whenever the space gets narrow, wherever the layout is used.
 */
export function TwoColumn({
  children,
  aside,
  ratio = '2:1',
  asideSide = 'end',
  stickyAside = false,
  gap = 'default',
  asideLabel = 'Details',
}: TwoColumnProps) {
  return (
    <div data-slot="two-column" data-ratio={ratio} className="@container w-full min-w-0">
      <div className={`grid grid-cols-1 items-start ${gap === 'wide' ? 'gap-8' : 'gap-6'} ${GRID[ratio]}`}>
        <div data-slot="two-column-main" className={`flex min-w-0 flex-col gap-6 ${MAIN[ratio]}`}>
          {children}
        </div>
        <aside
          aria-label={asideLabel}
          data-slot="two-column-aside"
          className={`flex min-w-0 flex-col gap-6 ${asideSide === 'start' ? '@3xl:-order-1' : ''} ${
            stickyAside ? '@3xl:sticky @3xl:top-6' : ''
          }`}
        >
          {aside}
        </aside>
      </div>
    </div>
  );
}
