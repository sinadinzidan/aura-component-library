import { useLook } from '../../looks/useLook';
import { Legend, type LegendItem } from '../Legend';
import { cx } from '../tones';

import type { StateSegment } from './oee';

export type StateStripRow = { label: string; detail?: string; segments: readonly StateSegment[] };

type StateStripProps = {
  /** What the strip shows, in words. */
  label: string;
  rows: readonly StateStripRow[];
  /** Start and end of the axis, in the same unit as the segments (hours). */
  start: number;
  end: number;
  /** Axis marks. */
  ticks: readonly { at: number; label: string }[];
  /** A marker for "now" on an unfinished period. */
  now?: { at: number; label: string };
  legend?: readonly LegendItem[];
  size?: 'md' | 'lg';
  className?: string;
};

const SOLID_LOOKS = ['console', 'poster', 'signal', 'blueprint'];

/**
 * Machine state over time: one band per unit, cut into running, planned-stop and unplanned-stop
 * segments on a shared time axis. Short stops stay visible because every segment has a minimum
 * width. Bands are rounded by default and square, gap-separated blocks in the block-built looks.
 */
export function StateStrip({ label, rows, start, end, ticks, now, legend, size = 'md', className }: StateStripProps) {
  const look = useLook();
  const square = SOLID_LOOKS.includes(look);
  const span = end - start || 1;
  const at = (value: number) => `${((value - start) / span) * 100}%`;
  const labelled = rows.some((row) => row.label);

  return (
    <figure data-look={look} className={cx('min-w-0 text-(--kit-text)', className)}>
      {legend ? (
        <div className="mb-4">
          <Legend items={legend} />
        </div>
      ) : null}
      <div role="img" aria-label={label} className="grid items-center gap-x-4 gap-y-3" style={{ gridTemplateColumns: labelled ? 'minmax(7rem, max-content) minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
        {rows.map((row) => (
          <div key={row.label} className="contents">
            {labelled ? (
              <div className="min-w-0">
                <div className="text-sm font-medium">{row.label}</div>
                {row.detail ? <div className="text-xs text-(--kit-text-2) tabular-nums">{row.detail}</div> : null}
              </div>
            ) : null}
            <div className={cx('relative', size === 'lg' ? 'h-10' : 'h-7', square ? '' : 'overflow-hidden rounded-(--kit-radius-sm)', 'bg-(--kit-track)')}>
              {row.segments.map((segment) => (
                <span
                  key={`${segment.from}-${segment.state}`}
                  data-tone={segment.tone}
                  data-state={segment.state}
                  title={`${segment.state}, ${segment.from}–${segment.to}`}
                  className={cx('absolute inset-y-0 min-w-1', segment.tone === 'neutral' ? 'bg-(--t-pop)' : 'bg-(--t-solid)', square && 'border-r border-(--kit-surface)')}
                  style={{ left: at(segment.from), width: `calc(${at(segment.to)} - ${at(segment.from)})` }}
                />
              ))}
              {now ? <span aria-hidden="true" className="absolute -inset-y-1 w-0.5 bg-(--kit-text)" style={{ left: at(now.at) }} /> : null}
            </div>
          </div>
        ))}
        {labelled ? <div /> : null}
        <div aria-hidden="true" className="relative h-5 text-xs text-(--kit-text-2) tabular-nums">
          {ticks.map((tick) => (
            <span
              key={tick.at}
              className={cx('absolute top-0 whitespace-nowrap', tick.at === start ? '' : tick.at === end ? '-translate-x-full' : '-translate-x-1/2')}
              style={{ left: at(tick.at) }}
            >
              {tick.label}
            </span>
          ))}
          {now ? (
            <span className="absolute top-0 -translate-x-1/2 bg-(--kit-text) px-1 font-medium whitespace-nowrap text-(--kit-surface)" style={{ left: at(now.at) }}>
              {now.label}
            </span>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
