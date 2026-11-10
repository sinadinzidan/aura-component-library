import type { ReactNode } from 'react';

/** How many of the 12 columns a cell takes on a wide screen. Narrower screens step down. */
export type DashboardSpan = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

/** Literal classes so Tailwind generates them. Every cell is full width on phones. */
const SPAN_CLASS: Record<DashboardSpan, string> = {
  2: 'col-span-6 md:col-span-4 xl:col-span-2',
  3: 'col-span-12 sm:col-span-6 xl:col-span-3',
  4: 'col-span-12 md:col-span-6 xl:col-span-4',
  5: 'col-span-12 xl:col-span-5',
  6: 'col-span-12 xl:col-span-6',
  7: 'col-span-12 xl:col-span-7',
  8: 'col-span-12 xl:col-span-8',
  9: 'col-span-12 xl:col-span-9',
  12: 'col-span-12',
};

type DashboardGridProps = { children: ReactNode };

/** The 12-column grid every dashboard uses, with one gap for rows and columns. */
export function DashboardGrid({ children }: DashboardGridProps) {
  return <div className="grid grid-cols-12 gap-4">{children}</div>;
}

type DashboardCellProps = {
  span: DashboardSpan;
  children: ReactNode;
};

/** One grid cell. Its child stretches to the row height, so panels in a row line up. */
export function DashboardCell({ span, children }: DashboardCellProps) {
  return <div className={`${SPAN_CLASS[span]} flex min-w-0 flex-col [&>*]:flex-1`}>{children}</div>;
}
