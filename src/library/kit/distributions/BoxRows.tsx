import { useLook } from '../../looks/useLook';
import { cx, formatNumber, toneLine, type Tone } from '../tones';

import { markRadius, markStyle } from './marks';
import { linearTicks, percent, type BoxStats } from './stats';

export type BoxRow = {
  id: string;
  label: string;
  /** Second line under the label: a tag, a count. */
  sublabel?: string;
  stats: BoxStats;
  tone?: Tone;
};

type BoxRowsProps = {
  /** What the rows compare, in words. */
  label: string;
  rows: readonly BoxRow[];
  min: number;
  max: number;
  unit?: string;
  decimals?: number;
  /** A limit drawn through every row. */
  limit?: { value: number; label: string; tone?: Tone };
  /** Number of intervals between scale ticks. */
  steps?: number;
  className?: string;
};

/**
 * Spread per row as a box plot: whiskers from minimum to maximum, a box for the middle half and
 * a tick for the median, all on one shared scale so rows compare at a glance.
 */
export function BoxRows({ label, rows, min, max, unit, decimals = 1, limit, steps = 4, className }: BoxRowsProps) {
  const look = useLook();
  const ticks = linearTicks(min, max, steps);
  const suffix = unit ? ` ${unit}` : '';
  const limitColor = toneLine(limit?.tone ?? 'critical');
  const columns = { gridTemplateColumns: 'minmax(9rem, 14rem) minmax(0, 1fr) 5.5rem' };

  return (
    <div role="img" aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col text-[var(--kit-text)]', className)}>
      <div className="grid items-end gap-x-4 pb-2 text-xs font-medium text-[var(--kit-text-2)]" style={columns}>
        <span>Unit</span>
        <span className="relative h-5">
          {limit ? (
            <span className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap font-semibold" style={{ left: percent(limit.value, min, max), color: limitColor }}>
              {limit.label} {formatNumber(limit.value, decimals)}
            </span>
          ) : null}
        </span>
        <span className="text-right">Median</span>
      </div>
      {rows.map((row) => {
        const color = toneLine(row.tone ?? 'accent');
        return (
          <div key={row.id} data-row={row.id} className="grid items-center gap-x-4 border-t border-[var(--kit-rule)] py-2.5" style={columns}>
            <div className="min-w-0">
              <div className="text-sm font-medium leading-5">{row.label}</div>
              {row.sublabel ? <div className="text-xs tabular-nums leading-4 text-[var(--kit-text-2)]">{row.sublabel}</div> : null}
            </div>
            <div className="relative h-7">
              <span className="absolute top-1/2 h-0.5 -translate-y-1/2" style={{ left: percent(row.stats.min, min, max), right: `calc(100% - ${percent(row.stats.max, min, max)})`, background: color }} />
              <span className="absolute inset-y-1.5 w-0.5 -translate-x-1/2" style={{ left: percent(row.stats.min, min, max), background: color }} />
              <span className="absolute inset-y-1.5 w-0.5 -translate-x-1/2" style={{ left: percent(row.stats.max, min, max), background: color }} />
              <span
                data-box=""
                className="absolute inset-y-0"
                style={{
                  ...markStyle(look, color),
                  left: percent(row.stats.q1, min, max),
                  right: `calc(100% - ${percent(row.stats.q3, min, max)})`,
                  borderRadius: markRadius(look, 8),
                  backgroundColor: look === 'blueprint' ? 'var(--kit-halo)' : undefined,
                }}
              />
              <span
                data-median=""
                className="absolute -inset-y-0.5 w-1 -translate-x-1/2 rounded-full bg-[var(--kit-text)] outline outline-2 outline-[var(--kit-halo)]"
                style={{ left: percent(row.stats.median, min, max) }}
              />
              {limit ? (
                <span data-limit="" className="absolute -inset-y-2.5 -translate-x-1/2" style={{ left: percent(limit.value, min, max), borderLeft: `1.5px dashed ${limitColor}` }} />
              ) : null}
            </div>
            <div className="text-right text-sm font-semibold tabular-nums">
              {formatNumber(row.stats.median, decimals)}
              <span className="font-normal text-[var(--kit-text-2)]">{suffix}</span>
            </div>
          </div>
        );
      })}
      <div className="grid gap-x-4 border-t border-[var(--kit-rule-strong)] pt-1.5 text-xs tabular-nums text-[var(--kit-text-2)]" style={columns}>
        <span />
        <span className="relative h-4">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className={cx('absolute whitespace-nowrap', index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2')}
              style={{ left: percent(tick, min, max) }}
            >
              {formatNumber(tick, decimals)}
            </span>
          ))}
        </span>
        <span className="text-right">{unit}</span>
      </div>
    </div>
  );
}
