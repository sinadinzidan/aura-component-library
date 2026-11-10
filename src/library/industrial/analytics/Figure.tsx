import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { figureReference } from './figureReference';

export type FigureProps = {
  /** Position in the report. Printed as "Figure 2" and used to refer to it from the text. */
  number: number | string;
  /** What the figure shows and the finding, as a sentence. */
  caption: string;
  /** `Figure` for charts and drawings, `Table` for tables; each kind is numbered on its own. */
  kind?: 'Figure' | 'Table';
  /** Where the data comes from and the period: "Source: 27-FT-20011, hourly averages". */
  source?: string;
  /** Tables carry their caption above, figures below. Defaults by `kind`. */
  captionSide?: 'top' | 'bottom';
  children: ReactNode;
  className?: string;
};

/**
 * A chart, drawing or table in a report with a numbered caption and an optional source line, so
 * the text can point at it ("see Figure 2") and it still makes sense when lifted out of the page.
 */
export function Figure({ number, caption, kind = 'Figure', source, captionSide, children, className }: FigureProps) {
  const side = captionSide ?? (kind === 'Table' ? 'top' : 'bottom');
  const text = (
    <figcaption data-slot="figure-caption" className="flex flex-col gap-0.5 text-xs text-medium-foreground">
      <span>
        <span className="font-semibold text-base-foreground">{figureReference(number, kind)}.</span> {caption}
      </span>
      {source ? <span className="text-muted-foreground">{source}</span> : null}
    </figcaption>
  );

  return (
    <figure data-slot="report-figure" data-kind={kind} className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      {side === 'top' ? text : null}
      <div className="w-full min-w-0">{children}</div>
      {side === 'bottom' ? text : null}
    </figure>
  );
}
