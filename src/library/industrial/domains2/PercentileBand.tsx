import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { LABEL_TEXT, SCALE_TEXT, formatValue } from '../status';
import { ValueReadout } from '../ValueReadout';

export type PercentileBandProps = {
  /** The result the range belongs to, e.g. "Gas export, next 30 days". */
  label: string;
  /** Low case: 10 % of outcomes fall below it. */
  p10: number;
  /** Median case. */
  p50: number;
  /** High case: 90 % of outcomes fall below it. */
  p90: number;
  unit?: string;
  decimals?: number;
  /** Ends of the drawn scale. Default to the band with a fifth of its width on either side. */
  min?: number;
  max?: number;
  /** A value to compare the range with, such as the plan or a contract volume. */
  reference?: { value: number; label: string };
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * A result as a range rather than a single number: the P10–P90 band with the median marked.
 * Use it wherever a forecast or simulation would otherwise pretend to be exact.
 */
export function PercentileBand({ label, p10, p50, p90, unit, decimals = 1, min, max, reference, className }: PercentileBandProps) {
  const pad = (p90 - p10) * 0.2 || 1;
  const low = min ?? Math.min(p10, reference?.value ?? p10) - pad;
  const high = max ?? Math.max(p90, reference?.value ?? p90) + pad;
  const suffix = unit ? ` ${unit}` : '';
  const marks = [
    { key: 'p10', name: 'P10', value: p10 },
    { key: 'p50', name: 'P50', value: p50 },
    { key: 'p90', name: 'P90', value: p90 },
  ];

  return (
    <div data-slot="percentile-band" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
        <ValueReadout size="sm" value={p50} unit={unit} decimals={decimals} />
      </div>
      <div
        role="img"
        aria-label={`${label}: median ${formatValue(p50, decimals)}${suffix}, 80 % range ${formatValue(p10, decimals)} to ${formatValue(p90, decimals)}${suffix}${
          reference ? `, ${reference.label.toLowerCase()} ${formatValue(reference.value, decimals)}${suffix}` : ''
        }`}
        className="relative h-4"
      >
        <span className="absolute inset-x-0 top-1 h-2 rounded-full bg-chart-neutral-100" />
        <span
          data-slot="band-range"
          className="absolute top-1 h-2 rounded-full bg-chart-1-200"
          style={{ left: percent(toFraction(p10, low, high)), width: percent(toFraction(p90, low, high) - toFraction(p10, low, high)) }}
        />
        <span data-slot="band-median" className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-chart-1-450" style={{ left: percent(toFraction(p50, low, high)) }} />
        {reference ? (
          <span data-slot="band-reference" className="absolute inset-y-0 w-px border-l border-dashed border-base-foreground" style={{ left: percent(toFraction(reference.value, low, high)) }} />
        ) : null}
      </div>
      <dl className={cn(SCALE_TEXT, 'flex flex-wrap gap-x-4 gap-y-1')}>
        {marks.map((mark) => (
          <div key={mark.key} className="flex gap-1.5">
            <dt>{mark.name}</dt>
            <dd className="text-base-foreground">{formatValue(mark.value, decimals)}</dd>
          </div>
        ))}
        {reference ? (
          <div className="ml-auto flex gap-1.5">
            <dt>{reference.label}</dt>
            <dd className="text-base-foreground">{formatValue(reference.value, decimals)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
