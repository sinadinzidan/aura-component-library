import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { SCALE_TEXT, formatValue } from '../status';

import { tornadoDomain, tornadoRows } from './scenarios';
import type { TornadoInput } from './scenarios';

export type TornadoBarsProps = {
  /** The output being tested, e.g. "Shaft power sensitivity". Becomes the accessible name with the top driver. */
  label: string;
  /** Output with every input at its base value. */
  baseline: number;
  /** One per input: the output with the input at the low and at the high end of its range. */
  items: readonly TornadoInput[];
  unit?: string;
  decimals?: number;
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * Sensitivity (tornado) bars: how far the output moves when each input goes from the low to the
 * high end of its range, everything else at base. Rows are sorted by swing, so the first row is
 * the input worth getting right. The lighter half is the low input value, the stronger the high.
 */
export function TornadoBars({ label, baseline, items, unit, decimals = 1, className }: TornadoBarsProps) {
  const rows = tornadoRows(items);
  const [min, max] = tornadoDomain(rows, baseline);
  const base = toFraction(baseline, min, max);
  const suffix = unit ? ` ${unit}` : '';
  const top = rows[0];

  return (
    <figure data-slot="tornado-bars" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div
        role="img"
        aria-label={`${label}: baseline ${formatValue(baseline, decimals)}${suffix}${top ? `; largest swing from ${top.label}, ${formatValue(top.from, decimals)} to ${formatValue(top.to, decimals)}${suffix}` : ''}`}
        className="flex flex-col gap-2.5"
      >
        {rows.map((row) => {
          const lowFraction = toFraction(row.low, min, max);
          const highFraction = toFraction(row.high, min, max);
          return (
            <div key={row.id} data-slot="tornado-row" className="grid grid-cols-[minmax(0,10rem)_3.5rem_minmax(0,1fr)_3.5rem] items-center gap-x-2 text-xs">
              <span className="text-base-foreground">
                {row.label}
                {row.lowLabel && row.highLabel ? <span className="block tabular-nums text-muted-foreground">{`${row.lowLabel} to ${row.highLabel}`}</span> : null}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">{formatValue(row.from, decimals)}</span>
              <span className="relative h-4">
                <span
                  data-slot="tornado-low"
                  className="absolute inset-y-0 bg-chart-1-200"
                  style={{ left: percent(Math.min(lowFraction, base)), width: percent(Math.abs(lowFraction - base)) }}
                />
                <span
                  data-slot="tornado-high"
                  className="absolute inset-y-0 bg-chart-1-450"
                  style={{ left: percent(Math.min(highFraction, base)), width: percent(Math.abs(highFraction - base)) }}
                />
                <span data-slot="tornado-baseline" className="absolute -inset-y-1 w-px bg-base-foreground" style={{ left: percent(base) }} />
              </span>
              <span className="tabular-nums text-muted-foreground">{formatValue(row.to, decimals)}</span>
            </div>
          );
        })}
      </div>
      <figcaption className={cn(SCALE_TEXT, 'flex flex-wrap items-center gap-x-4 gap-y-1')}>
        <span>
          Baseline {formatValue(baseline, decimals)}
          {suffix}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-xs bg-chart-1-200" />
          Input at low end
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-xs bg-chart-1-450" />
          Input at high end
        </span>
      </figcaption>
    </figure>
  );
}
