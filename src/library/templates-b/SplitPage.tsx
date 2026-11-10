import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type SplitPageProps = {
  /** The working half: the form or the decision. */
  children: ReactNode;
  /** The supporting half: a product statement, a live component, context for the decision. */
  aside: ReactNode;
  /** Accessible name of the supporting half: "About Nordkapp". */
  asideLabel: string;
  /** Which edge the supporting half sits on. */
  asideSide?: 'left' | 'right';
  /** Share of the width the supporting half takes once the page is wide enough to split. */
  asideShare?: 'third' | 'half';
  /** `muted` tints the supporting half; `plain` separates the halves with a rule only. */
  asideSurface?: 'muted' | 'plain';
  /** Top of the working half: the product mark. */
  header?: ReactNode;
  /** Bottom of the working half: legal links. */
  footer?: ReactNode;
  /** Width cap of the content in the working half. */
  width?: 'sm' | 'md';
  className?: string;
};

/**
 * A two-pane page: the task on one side and something that supports it on the other. It splits
 * from the width of its container, so below roughly 48rem the supporting half is dropped and the
 * task takes the whole page; nothing the user needs may live only in the aside.
 */
export function SplitPage({
  children,
  aside,
  asideLabel,
  asideSide = 'right',
  asideShare = 'half',
  asideSurface = 'muted',
  header,
  footer,
  width = 'sm',
  className,
}: SplitPageProps) {
  return (
    <div data-slot="split-page" className={cn('@container h-full min-h-full w-full bg-base-background', className)}>
      <div
        className={cn(
          'grid min-h-full grid-cols-1',
          asideShare === 'half' ? '@3xl:grid-cols-2' : '@3xl:grid-cols-3'
        )}
      >
        <div
          data-slot="split-page-main"
          className={cn('flex min-w-0 flex-col', asideShare === 'third' ? '@3xl:col-span-2' : undefined, asideSide === 'left' ? '@3xl:order-2' : undefined)}
        >
          {header ? <header className="flex shrink-0 items-center justify-between gap-4 px-6 py-4">{header}</header> : null}
          <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
            <div className={cn('flex w-full flex-col gap-4', width === 'sm' ? 'max-w-sm' : 'max-w-md')}>{children}</div>
          </main>
          {footer ? (
            <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4 text-xs text-muted-foreground">{footer}</footer>
          ) : null}
        </div>
        <aside
          aria-label={asideLabel}
          data-slot="split-page-aside"
          data-surface={asideSurface}
          className={cn(
            'hidden min-w-0 flex-col justify-center gap-6 p-8 @3xl:flex',
            asideSurface === 'muted' ? 'bg-muted-background' : undefined,
            asideSide === 'left' ? 'border-r border-default @3xl:order-1' : 'border-l border-default'
          )}
        >
          {aside}
        </aside>
      </div>
    </div>
  );
}
