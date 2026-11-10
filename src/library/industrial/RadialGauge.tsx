import { cn } from '../../lib/utils';

import { GAUGE_START_ANGLE, GAUGE_SWEEP, arcPath, fractionToAngle, gaugeHeight, polarToCartesian, toFraction } from './geometry';
import {
  LABEL_TEXT,
  SCALE_TEXT,
  TONE_MARK_STROKE,
  TONE_ZONE_STROKE,
  describeReading,
  formatLimit,
  formatValue,
  drawableZones,
  toneFromZones,
  zonesFromLimits,
} from './status';
import type { Limits, Tone, Zone } from './status';
import type { ValueReadoutSize } from './ValueReadout';
import { ValueReadout } from './ValueReadout';

export type RadialGaugeSize = 'sm' | 'md' | 'lg';

export type RadialGaugeProps = {
  label: string;
  /** `null` draws an empty gauge with an em dash. */
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  /** Operating limits; the warning and critical zones are derived from them. */
  limits?: Limits;
  /** Explicit zones, when limits do not describe the scale. Wins over `limits`. */
  zones?: readonly Zone[];
  /** Setpoint or target, drawn as a tick across the arc. */
  target?: number;
  size?: RadialGaugeSize;
  /** Overrides the tone derived from the zones. */
  tone?: Tone;
  /** Min and max printed at the ends of the arc. */
  showRange?: boolean;
  /** Label printed under the gauge. Turn off when a heading already names it. */
  showLabel?: boolean;
  className?: string;
};

const DIMENSIONS: Record<RadialGaugeSize, { size: number; track: number; zone: number; readout: ValueReadoutSize }> = {
  sm: { size: 96, track: 6, zone: 2, readout: 'sm' },
  md: { size: 144, track: 8, zone: 3, readout: 'md' },
  lg: { size: 192, track: 10, zone: 3, readout: 'lg' },
};

const ZONE_GAP = 3;
const RANGE_LABEL_HEIGHT = 16;

/**
 * A 270° dial for one measurement against its range. The value arc stays the data colour until
 * the value enters a warning or critical zone; zones are a thin outer ring so they inform
 * without shouting. Use it for a few key readings — a table of numbers scales better than dials.
 */
export function RadialGauge({
  label,
  value,
  min = 0,
  max = 100,
  unit,
  decimals = 0,
  limits,
  zones,
  target,
  size = 'md',
  tone,
  showRange = true,
  showLabel = true,
  className,
}: RadialGaugeProps) {
  const dimensions = DIMENSIONS[size];
  const center = dimensions.size / 2;
  const zoneRadius = center - dimensions.zone / 2 - 1;
  const radius = zoneRadius - dimensions.zone / 2 - ZONE_GAP - dimensions.track / 2;
  const height = gaugeHeight(center, zoneRadius, dimensions.zone);
  const hasValue = value !== null && Number.isFinite(value);
  const resolvedZones = zones ?? (limits ? zonesFromLimits(min, max, limits) : []);
  const drawnZones = zones ?? drawableZones(resolvedZones);
  const resolvedTone = tone ?? (hasValue ? toneFromZones(value, resolvedZones) : 'neutral');
  const angle = (amount: number) => fractionToAngle(toFraction(amount, min, max));
  const tickAt = (offset: number) =>
    target === undefined ? undefined : polarToCartesian(center, center, radius + offset, angle(target));
  const targetInner = tickAt(-dimensions.track / 2 - 2);
  const targetOuter = tickAt(dimensions.track / 2 + 2);
  const rangeStart = polarToCartesian(center, center, radius, GAUGE_START_ANGLE);
  const rangeEnd = polarToCartesian(center, center, radius, GAUGE_START_ANGLE + GAUGE_SWEEP);

  return (
    <div data-slot="radial-gauge" data-tone={resolvedTone} className={cn('inline-flex flex-col items-center gap-1', className)}>
      <div
        role="img"
        aria-label={`${describeReading(label, value, unit, decimals, resolvedTone)}, range ${formatLimit(min, decimals)} to ${formatLimit(max, decimals)}`}
        className="relative"
        style={{ width: dimensions.size, height: showRange ? height + RANGE_LABEL_HEIGHT : height }}
      >
        <svg width={dimensions.size} height={height} viewBox={`0 0 ${dimensions.size} ${height}`} fill="none" className="block">
          <path
            data-slot="gauge-track"
            d={arcPath(center, center, radius, GAUGE_START_ANGLE, GAUGE_START_ANGLE + GAUGE_SWEEP)}
            strokeWidth={dimensions.track}
            strokeLinecap="round"
            className="stroke-chart-neutral-100"
          />
          {drawnZones.map((zone) => (
            <path
              key={`${zone.from}-${zone.to}`}
              data-slot="gauge-zone"
              data-tone={zone.tone}
              d={arcPath(center, center, zoneRadius, angle(zone.from), angle(zone.to))}
              strokeWidth={dimensions.zone}
              className={TONE_ZONE_STROKE[zone.tone]}
            />
          ))}
          {hasValue && toFraction(value, min, max) > 0 ? (
            <path
              data-slot="gauge-value"
              d={arcPath(center, center, radius, GAUGE_START_ANGLE, angle(value))}
              strokeWidth={dimensions.track}
              strokeLinecap="round"
              className={TONE_MARK_STROKE[resolvedTone]}
            />
          ) : null}
          {targetInner && targetOuter ? (
            <line
              data-slot="gauge-target"
              x1={targetInner.x}
              y1={targetInner.y}
              x2={targetOuter.x}
              y2={targetOuter.y}
              strokeWidth={2}
              strokeLinecap="round"
              className="stroke-base-foreground"
            />
          ) : null}
        </svg>

        <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: 0, height: dimensions.size }}>
          <ValueReadout value={hasValue ? value : null} unit={unit} decimals={decimals} size={dimensions.readout} tone={resolvedTone} stacked />
        </div>

        {showRange ? (
          <div aria-hidden className={cn(SCALE_TEXT, 'leading-none')}>
            <span className="absolute -translate-x-1/2" style={{ left: rangeStart.x, top: height + 2 }}>
              {formatValue(min, 0)}
            </span>
            <span className="absolute -translate-x-1/2" style={{ left: rangeEnd.x, top: height + 2 }}>
              {formatValue(max, 0)}
            </span>
          </div>
        ) : null}
      </div>
      {showLabel ? <span className={cn(LABEL_TEXT, 'max-w-full truncate text-center')}>{label}</span> : null}
    </div>
  );
}
