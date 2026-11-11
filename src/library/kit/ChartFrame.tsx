import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { Legend, type LegendItem } from './Legend';
import { cx } from './tones';

type ChartFrameProps = {
  /** What the chart shows, in words: "Gas export, last 24 hours against the daily plan". */
  label: string;
  legend?: readonly LegendItem[];
  /** Above the plot, at the start: the current value or a short reading of the chart. */
  headline?: ReactNode;
  /** Annotations: under the plot in most looks, in a column beside it in editorial. */
  notes?: ReactNode;
  /** Plot height in px. */
  height?: number;
  className?: string;
  /** The plot, usually a responsive chart. */
  children: ReactNode;
};

/**
 * The frame every kit chart sits in: a named plot area with room for a headline, a legend and
 * annotations. The ready-made charts use it; use it directly for a custom plot.
 */
export function ChartFrame({ label, legend, headline, notes, height = 240, className, children }: ChartFrameProps) {
  const look = useLook();
  return (
    <figure data-look={look} data-notes={notes ? 'true' : 'false'} className={cx('kit-chart', className)}>
      {headline || legend ? (
        <div className="kit-chart-top">
          <div>{headline}</div>
          {legend ? <Legend items={legend} /> : null}
        </div>
      ) : null}
      <div role="img" aria-label={label} className="kit-chart-plot" style={{ height }}>
        {children}
      </div>
      {notes ? <figcaption className="kit-chart-notes">{notes}</figcaption> : null}
    </figure>
  );
}
