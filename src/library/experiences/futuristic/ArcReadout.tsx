import { cn } from '../../../lib/utils';
import { GAUGE_START_ANGLE, GAUGE_SWEEP, arcPath, fractionToAngle, gaugeHeight, toFraction } from '../../industrial/geometry';
import { formatReading, formatValue } from '../../industrial/status';

import { NEON_STROKE, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { ringTicks } from './radar';

export type ArcReadoutProps = {
  /** `null` draws an empty arc and an em dash. */
  value: number | null;
  label: string;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  tone?: NeonTone;
  /** Layout classes; set the width here. */
  className?: string;
};

const WIDTH = 100;
const CENTER = 50;
const RADIUS = 40;
const HEIGHT = gaugeHeight(CENTER, RADIUS, 6);

/**
 * A radial readout drawn as a single glowing arc over a hairline track, with the figure in the
 * middle and a caption below. For heads-up panels where a filled gauge would be too heavy; the
 * arc gives the proportion, the number gives the value.
 */
export function ArcReadout({ value, label, min = 0, max = 100, unit, decimals = 0, tone = 'accent', className }: ArcReadoutProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const fraction = hasValue ? toFraction(value, min, max) : 0;
  const end = fractionToAngle(fraction);

  return (
    <div
      data-slot="arc-readout"
      data-tone={tone}
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={hasValue ? value : undefined}
      aria-valuetext={hasValue ? formatReading(value, unit, decimals) : 'No data'}
      className={cn(NEON_TONE[tone], 'flex w-24 shrink-0 flex-col items-center gap-1', className)}
    >
      <div className="relative w-full">
        <svg aria-hidden="true" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} fill="none" className={cn('block w-full', NEON_STROKE)}>
          <path d={arcPath(CENTER, CENTER, RADIUS, GAUGE_START_ANGLE, GAUGE_START_ANGLE + GAUGE_SWEEP)} strokeWidth={1} opacity={0.35} />
          {ringTicks(CENTER, CENTER, RADIUS - 4, 24, 2, 3, 4)
            .filter((_, index) => index <= 9 || index >= 15)
            .map((tick, index) => (
              <line key={index} {...tick} strokeWidth={1} opacity={0.5} />
            ))}
          {fraction > 0 ? (
            <path
              data-slot="arc-readout-value"
              d={arcPath(CENTER, CENTER, RADIUS, GAUGE_START_ANGLE, end)}
              strokeWidth={3.5}
              strokeLinecap="round"
              className={NEON_SVG_GLOW}
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className="font-mono text-base font-semibold leading-none tabular-nums text-base-foreground">
            {formatValue(hasValue ? value : null, decimals)}
          </span>
          {unit ? <span className="mt-1 text-xs leading-none text-muted-foreground">{unit}</span> : null}
        </div>
      </div>
      <span className="text-center text-xs uppercase leading-tight tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
