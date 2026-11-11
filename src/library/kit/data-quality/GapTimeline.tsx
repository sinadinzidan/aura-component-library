import { useLook } from '../../looks/useLook';
import { markRadius, markStyle } from '../distributions/marks';
import { percent } from '../distributions/stats';
import { cx, formatNumber, toneLine, type Tone } from '../tones';

import { coveragePercent, normalizeGaps, type Interval } from './quality';

export type GapRow = {
  id: string;
  /** The tag or series name. */
  label: string;
  /** Second line: what it measures. */
  sublabel?: string;
  gaps: readonly Interval[];
};

type GapTimelineProps = {
  /** What the timeline covers, in words. */
  label: string;
  rows: readonly GapRow[];
  start: number;
  end: number;
  /** Time captions under the tracks. */
  ticks: readonly { at: number; label: string }[];
  /** Coverage below this is drawn as a warning, in percent. */
  target?: number;
  tone?: Tone;
  className?: string;
};

/**
 * Where data is missing: one track per series across a time window, solid where data arrived and
 * hatched where it did not, with the coverage of each written at the end of its row.
 */
export function GapTimeline({ label, rows, start, end, ticks, target = 99, tone = 'accent', className }: GapTimelineProps) {
  const look = useLook();
  const columns = { gridTemplateColumns: 'minmax(7rem, min(13rem, 34%)) minmax(0, 1fr) 4.5rem' };
  const gapColor = toneLine('critical');

  return (
    <div role="img" aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col text-[var(--kit-text)]', className)}>
      <div className="grid gap-x-4 pb-2 text-xs font-medium text-[var(--kit-text-2)]" style={columns}>
        <span>Series</span>
        <span />
        <span className="text-right">Coverage</span>
      </div>
      {rows.map((row) => {
        const gaps = normalizeGaps(start, end, row.gaps);
        const coverage = coveragePercent(start, end, row.gaps);
        const below = coverage < target;
        return (
          <div key={row.id} data-row={row.id} className="grid items-center gap-x-4 border-t border-[var(--kit-rule)] py-2.5" style={columns}>
            <div className="min-w-0">
              <div className="text-sm font-medium tabular-nums leading-5">{row.label}</div>
              {row.sublabel ? <div className="text-xs leading-4 text-[var(--kit-text-2)]">{row.sublabel}</div> : null}
            </div>
            <div className="relative h-6 overflow-hidden" style={{ ...markStyle(look, toneLine(tone)), borderRadius: markRadius(look, 12) }}>
              {gaps.map((gap) => (
                <span
                  key={gap.from}
                  data-gap=""
                  className="absolute inset-y-0"
                  style={{
                    left: percent(gap.from, start, end),
                    width: `max(3px, calc(${percent(gap.to, start, end)} - ${percent(gap.from, start, end)}))`,
                    background: `repeating-linear-gradient(135deg, ${gapColor} 0 2px, var(--kit-halo) 2px 6px)`,
                    backgroundColor: 'var(--kit-halo)',
                    outline: `1.5px solid ${gapColor}`,
                    outlineOffset: -1.5,
                  }}
                />
              ))}
            </div>
            <div data-coverage="" className="text-right text-sm font-semibold tabular-nums" style={{ color: below ? toneLine('critical') : undefined }}>
              {formatNumber(coverage, 1)} %
            </div>
          </div>
        );
      })}
      <div className="grid gap-x-4 border-t border-[var(--kit-rule-strong)] pt-1.5 text-xs tabular-nums text-[var(--kit-text-2)]" style={columns}>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-5" style={{ background: `repeating-linear-gradient(135deg, ${gapColor} 0 2px, var(--kit-halo) 2px 6px)`, outline: `1.5px solid ${gapColor}`, outlineOffset: -1.5 }} />
          No data
        </span>
        <span className="relative h-4">
          {ticks.map((tick, index) => (
            <span
              key={tick.at}
              className={cx('absolute whitespace-nowrap', index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2')}
              style={{ left: percent(tick.at, start, end) }}
            >
              {tick.label}
            </span>
          ))}
        </span>
        <span />
      </div>
    </div>
  );
}
