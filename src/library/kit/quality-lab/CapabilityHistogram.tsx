import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { histogram, type SpcLimits, type SpcSpec } from './spc';

type CapabilityHistogramProps = {
  /** What the histogram shows, in words. */
  label: string;
  values: readonly number[];
  limits: SpcLimits;
  spec: SpcSpec;
  decimals?: number;
  bins?: number;
  /** Plot height in px. */
  height?: number;
  className?: string;
};

const percent = (share: number): string => `${(share * 100).toFixed(2)}%`;

/**
 * Where the results fall inside the specification: a histogram on the specification's own scale,
 * with the limits and the process mean drawn in, so the room on each side is visible at a glance.
 */
export function CapabilityHistogram({ label, values, limits, spec, decimals = 1, bins = 14, height = 96, className }: CapabilityHistogramProps) {
  const look = useLook();
  const low = Math.min(...values, limits.lcl);
  const high = Math.max(...values, limits.ucl);
  const lower = spec.lsl ?? low;
  const upper = spec.usl ?? high;
  const pad = (Math.max(upper, high) - Math.min(lower, low)) * 0.06;
  const min = Math.min(lower, low) - pad;
  const max = Math.max(upper, high) + pad;
  const span = max - min || 1;
  const counts = histogram(values, min, max, bins);
  const peak = Math.max(...counts, 1);
  const width = span / bins;
  const outside = (index: number): boolean => {
    const centre = min + (index + 0.5) * width;
    return (spec.usl !== undefined && centre > spec.usl) || (spec.lsl !== undefined && centre < spec.lsl);
  };
  const marks = [
    { id: 'lsl', value: spec.lsl, name: 'Lower spec' },
    { id: 'usl', value: spec.usl, name: 'Upper spec' },
  ];

  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <div role="img" aria-label={label} className="relative w-full" style={{ height }}>
        <div className="absolute inset-0 flex items-end gap-px">
          {counts.map((count, index) => (
            <span
              key={index}
              data-bin={count}
              className={cx('flex-1 rounded-t-[var(--kit-radius-sm)]', outside(index) ? 'bg-[var(--kit-line-critical)]' : 'bg-[var(--kit-line-accent)]')}
              style={{ height: count === 0 ? 2 : percent((count / peak) * 0.92), opacity: count === 0 ? 0.25 : 1 }}
            />
          ))}
        </div>
        {marks.map((mark) =>
          mark.value === undefined ? null : (
            <span key={mark.id} data-limit={mark.id} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--kit-text)]" style={{ left: percent((mark.value - min) / span) }} />
          )
        )}
        <span data-limit="mean" className="absolute inset-y-0 w-px -translate-x-1/2 border-l border-dashed border-[var(--kit-text-2)]" style={{ left: percent((limits.mean - min) / span) }} />
      </div>
      <div className="relative h-5 w-full text-xs tabular-nums text-[var(--kit-text-2)]">
        {marks.map((mark) =>
          mark.value === undefined ? null : (
            <span
              key={mark.id}
              className={cx('absolute whitespace-nowrap font-medium', mark.id === 'lsl' ? '' : '-translate-x-full')}
              style={{ left: percent((mark.value - min) / span) }}
            >
              {mark.name} {formatNumber(mark.value, decimals)}
            </span>
          )
        )}
      </div>
    </div>
  );
}
