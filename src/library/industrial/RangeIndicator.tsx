import { cn } from '../../lib/utils';

import { toFraction } from './geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, describeReading, formatLimit, toneFromLimits } from './status';
import type { Limits, Tone } from './status';
import { ValueReadout } from './ValueReadout';

export type RangeIndicatorProps = {
  label: string;
  value: number | null;
  /** Ends of the drawn scale. */
  min: number;
  max: number;
  /** The operating band is drawn between `low` and `high`. */
  limits: Limits;
  unit?: string;
  decimals?: number;
  /** Overrides the tone derived from the limits. */
  tone?: Tone;
  /** Label and readout above the bar. */
  showHeader?: boolean;
  /** Low and high limit values under the band edges. */
  showLimits?: boolean;
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * Where a value sits inside its operating band: a marker on a scale with the low–high band
 * shaded. Use it when distance to a limit matters more than distance from zero — pressures,
 * temperatures, levels.
 */
export function RangeIndicator({
  label,
  value,
  min,
  max,
  limits,
  unit,
  decimals = 0,
  tone,
  showHeader = true,
  showLimits = true,
  className,
}: RangeIndicatorProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const resolvedTone = tone ?? (hasValue ? toneFromLimits(value, limits) : 'neutral');
  const bandStart = toFraction(limits.low ?? min, min, max);
  const bandEnd = toFraction(limits.high ?? max, min, max);
  // Labels of a narrow band would collide when centred on its edges, so they move outwards.
  const narrow = bandEnd - bandStart < 0.3;
  const lowAnchor = narrow && bandStart > 0.15 ? '-translate-x-full' : '-translate-x-1/2';
  const highAnchor = narrow && bandEnd < 0.85 ? 'translate-x-0' : '-translate-x-1/2';
  const limitText =
    limits.low !== undefined && limits.high !== undefined
      ? `, operating band ${formatLimit(limits.low, decimals)} to ${formatLimit(limits.high, decimals)}`
      : '';

  return (
    <div data-slot="range-indicator" data-tone={resolvedTone} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      {showHeader ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
          <ValueReadout value={hasValue ? value : null} unit={unit} decimals={decimals} size="sm" tone={resolvedTone} />
        </div>
      ) : null}

      <div role="img" aria-label={`${describeReading(label, value, unit, decimals, resolvedTone)}${limitText}`} className="relative h-3.5">
        <div data-slot="range-track" className="absolute inset-x-0 top-1 h-1.5 rounded-full bg-chart-neutral-100" />
        <div
          data-slot="range-band"
          className="absolute top-1 h-1.5 rounded-full bg-chart-neutral-300"
          style={{ left: percent(bandStart), width: percent(Math.max(bandEnd - bandStart, 0)) }}
        />
        {hasValue ? (
          <span
            data-slot="range-marker"
            className={cn('absolute top-0 h-3.5 w-1 -translate-x-1/2 rounded-full', TONE_MARK_BG[resolvedTone])}
            style={{ left: percent(toFraction(value, min, max)) }}
          />
        ) : null}
      </div>

      {showLimits ? (
        <div aria-hidden className={cn(SCALE_TEXT, 'relative h-3 leading-none')}>
          {limits.low !== undefined ? (
            <span data-slot="range-low" className={cn('absolute', lowAnchor)} style={{ left: percent(bandStart) }}>
              {formatLimit(limits.low, decimals)}
            </span>
          ) : null}
          {limits.high !== undefined ? (
            <span data-slot="range-high" className={cn('absolute', highAnchor)} style={{ left: percent(bandEnd) }}>
              {formatLimit(limits.high, decimals)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
