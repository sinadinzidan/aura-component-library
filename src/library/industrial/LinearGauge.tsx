import { cn } from '../../lib/utils';

import { toFraction } from './geometry';
import {
  LABEL_TEXT,
  SCALE_TEXT,
  TONE_MARK_BG,
  TONE_ZONE_BG,
  describeReading,
  formatLimit,
  formatValue,
  drawableZones,
  toneFromZones,
  zonesFromLimits,
} from './status';
import type { Limits, Tone, Zone } from './status';
import { ValueReadout } from './ValueReadout';

export type LinearGaugeProps = {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  limits?: Limits;
  /** Explicit zones. Wins over `limits`. */
  zones?: readonly Zone[];
  /** Setpoint or target, drawn as a tick across the bar. */
  target?: number;
  /** Overrides the tone derived from the zones. */
  tone?: Tone;
  size?: 'sm' | 'md';
  /** Label and readout above the bar. Turn off inside table cells that already show them. */
  showHeader?: boolean;
  /** Min and max under the bar. */
  showScale?: boolean;
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * A bullet bar: the value from the start of its range, a thin strip marking the warning and
 * critical zones, and an optional target tick. The compact alternative to a dial — it stacks in
 * lists and fits table cells.
 */
export function LinearGauge({
  label,
  value,
  min = 0,
  max = 100,
  unit,
  decimals = 0,
  limits,
  zones,
  target,
  tone,
  size = 'md',
  showHeader = true,
  showScale = false,
  className,
}: LinearGaugeProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const resolvedZones = zones ?? (limits ? zonesFromLimits(min, max, limits) : []);
  const drawnZones = zones ?? drawableZones(resolvedZones);
  const resolvedTone = tone ?? (hasValue ? toneFromZones(value, resolvedZones) : 'neutral');
  const fraction = hasValue ? toFraction(value, min, max) : 0;

  return (
    <div data-slot="linear-gauge" data-tone={resolvedTone} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      {showHeader ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
          <ValueReadout value={hasValue ? value : null} unit={unit} decimals={decimals} size={size === 'sm' ? 'xs' : 'sm'} tone={resolvedTone} />
        </div>
      ) : null}

      <div
        role="img"
        aria-label={`${describeReading(label, value, unit, decimals, resolvedTone)}, range ${formatLimit(min, decimals)} to ${formatLimit(max, decimals)}`}
        className="relative flex flex-col gap-0.5"
      >
        <div data-slot="gauge-track" className={cn('overflow-hidden rounded-full bg-chart-neutral-100', size === 'sm' ? 'h-1.5' : 'h-2')}>
          <div data-slot="gauge-value" className={cn('h-full rounded-full', TONE_MARK_BG[resolvedTone])} style={{ width: percent(fraction) }} />
        </div>
        {drawnZones.length > 0 ? (
          <div className="relative h-0.5">
            {drawnZones.map((zone) => (
              <span
                key={`${zone.from}-${zone.to}`}
                data-slot="gauge-zone"
                data-tone={zone.tone}
                className={cn('absolute inset-y-0', TONE_ZONE_BG[zone.tone])}
                style={{
                  left: percent(toFraction(zone.from, min, max)),
                  width: percent(toFraction(zone.to, min, max) - toFraction(zone.from, min, max)),
                }}
              />
            ))}
          </div>
        ) : null}
        {target !== undefined ? (
          <span
            data-slot="gauge-target"
            className={cn('absolute -top-1 w-0.5 -translate-x-1/2 rounded-full bg-base-foreground', size === 'sm' ? 'h-3.5' : 'h-4')}
            style={{ left: percent(toFraction(target, min, max)) }}
          />
        ) : null}
      </div>

      {showScale ? (
        <div aria-hidden className={cn(SCALE_TEXT, 'flex justify-between leading-none')}>
          <span>{formatValue(min, 0)}</span>
          <span>{formatValue(max, 0)}</span>
        </div>
      ) : null}
    </div>
  );
}
