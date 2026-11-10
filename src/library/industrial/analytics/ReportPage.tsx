import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type ReportPageProps = {
  /** What the page is, for the accessible name: "Daily production report, page 1". */
  label: string;
  /** `portrait` and `landscape` keep A4 proportions; `auto` is a strip of paper as tall as its content. */
  orientation?: 'portrait' | 'landscape' | 'auto';
  /** Top of the page, usually a `ReportHeader`. */
  header?: ReactNode;
  /** Bottom of the page: the page number strip or a sign-off. Stays at the bottom edge. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

const PROPORTION = {
  portrait: 'aspect-[210/297] max-w-3xl',
  landscape: 'aspect-[297/210] max-w-5xl',
  auto: 'max-w-3xl',
} as const;

/**
 * A sheet of paper on screen: a plain base surface with print-like margins, a header and a footer
 * pinned to the bottom edge. Report layouts sit on it so they can be judged the way they will
 * print. The sheet keeps A4 proportions and grows instead of clipping when content runs long.
 */
export function ReportPage({ label, orientation = 'portrait', header, footer, children, className }: ReportPageProps) {
  return (
    <article
      data-slot="report-page"
      data-orientation={orientation}
      aria-label={label}
      className={cn('flex w-full flex-col gap-6 rounded-sm border border-default bg-base-background p-10 text-base-foreground', PROPORTION[orientation], className)}
    >
      {header}
      <div data-slot="report-body" className="flex min-w-0 flex-1 flex-col gap-6">
        {children}
      </div>
      {footer ? <div data-slot="report-footer">{footer}</div> : null}
    </article>
  );
}
