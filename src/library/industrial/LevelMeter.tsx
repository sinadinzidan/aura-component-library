import { cn } from '../../lib/utils';

import { toFraction } from './geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, TONE_MARK_BG_SOFT, describeReading, formatValue, toneFromLimits } from './status';
import type { Limits, Tone } from './status';
import { ValueReadout } from './ValueReadout';

export type LevelMeterProps = {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  /** Level limits, drawn as ticks beside the vessel: LL, L, H, HH. */
  limits?: Limits;
  /** Overrides the tone derived from the limits. */
  tone?: Tone;
  /** Height of the vessel in pixels. */
  height?: number;
  /** Limit ticks and their values to the right of the vessel. */
  showLimits?: boolean;
  /** Readout and label under the vessel. */
  showReadout?: boolean;
  className?: string;
};

const LIMIT_NAMES = [
  ['highHigh', 'HH'],
  ['high', 'H'],
  ['low', 'L'],
  ['lowLow', 'LL'],
] as const;

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * Vertical level in a vessel or tank, with its limit ticks. Reads like the sight glass it stands
 * for; use it for separators, tanks and sumps where "how full" is the question.
 */
export function LevelMeter({
  label,
  value,
  min = 0,
  max = 100,
  unit = '%',
  decimals = 0,
  limits = {},
  tone,
  height = 144,
  showLimits = true,
  showReadout = true,
  className,
}: LevelMeterProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const resolvedTone = tone ?? (hasValue ? toneFromLimits(value, limits) : 'neutral');
  const fraction = hasValue ? toFraction(value, min, max) : 0;
  const ticks = LIMIT_NAMES.flatMap(([key, name]) => {
    const limit = limits[key];
    return limit === undefined ? [] : [{ name, limit, at: toFraction(limit, min, max) }];
  });

  return (
    <div data-slot="level-meter" data-tone={resolvedTone} className={cn('inline-flex flex-col items-start gap-2', className)}>
      <div className="flex gap-2" style={{ height }}>
        <div
          role="img"
          aria-label={`${describeReading(label, value, unit, decimals, resolvedTone)}, range ${formatValue(min, decimals)} to ${formatValue(max, decimals)}`}
          className="relative h-full w-12 overflow-hidden rounded-md bg-chart-neutral-100"
        >
          <div data-slot="level-fill" className={cn('absolute inset-x-0 bottom-0', TONE_MARK_BG_SOFT[resolvedTone])} style={{ height: percent(fraction) }}>
            {fraction > 0 ? <div className={cn('h-0.5', TONE_MARK_BG[resolvedTone])} /> : null}
          </div>
        </div>
        {showLimits && ticks.length > 0 ? (
          <div aria-hidden className={cn(SCALE_TEXT, 'relative h-full w-14 leading-none')}>
            {ticks.map((tick) => (
              <span
                key={tick.name}
                data-slot="level-limit"
                className="absolute left-0 flex translate-y-1/2 items-center gap-1.5"
                style={{ bottom: percent(tick.at) }}
              >
                <span className="h-px w-2 bg-chart-neutral-450" />
                <span>
                  {tick.name} {formatValue(tick.limit, 0)}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {showReadout ? (
        <div className="flex flex-col gap-1">
          <ValueReadout value={hasValue ? value : null} unit={unit} decimals={decimals} size="sm" tone={resolvedTone} />
          <span className={LABEL_TEXT}>{label}</span>
        </div>
      ) : null}
    </div>
  );
}
