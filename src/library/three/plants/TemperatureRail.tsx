import { cn } from '../../../lib/utils';

import { formatTemperature, temperatureFraction, temperatureGradient } from './temperatureRamp';
import type { TemperatureScale } from './temperatureRamp';

export type TemperatureRailProps = {
  /** Temperature at the current stop in °C. `null` shows the rail without a marker (the overview). */
  temperature: number | null;
  /** Warm and cold ends of the rail. */
  scale: TemperatureScale;
  /** Temperatures labelled along the rail. */
  ticks?: readonly number[];
  /** Name of what the marker is on, e.g. the tour stop. Becomes part of the accessible description. */
  subject?: string;
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 1000) / 10}%`;

/**
 * A vertical thermometer-style rail: warm at the top, cold at the bottom, in the temperature
 * ramp's token colours, with a marker that slides to the temperature of the current tour stop.
 * The number is always printed next to the marker, so the colour never carries it alone.
 * Give it a height with `className`; the track stretches to fill it.
 */
export function TemperatureRail({ temperature, scale, ticks = [], subject, className }: TemperatureRailProps) {
  const description =
    temperature === null ? 'Process temperature, from ambient to cold' : `Process temperature${subject ? ` at ${subject}` : ''}: ${formatTemperature(temperature)}`;

  return (
    <div role="img" aria-label={description} data-slot="temperature-rail" className={cn('flex min-h-0 items-stretch gap-2', className)}>
      <div className="relative w-9 shrink-0">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 rounded-full border border-default"
          style={{ background: temperatureGradient('to bottom') }}
        />
        {ticks.map((tick) => (
          <span
            key={tick}
            aria-hidden="true"
            className="absolute right-0 flex -translate-y-1/2 items-center gap-1 text-xs tabular-nums text-muted-foreground"
            style={{ top: percent(temperatureFraction(tick, scale)) }}
          >
            <span className="h-px w-2 bg-emphasized" />
          </span>
        ))}
        {temperature === null ? null : (
          <span
            data-slot="temperature-marker"
            aria-hidden="true"
            className="absolute left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-[var(--primary-background)] bg-base-background shadow-[0_0_10px_color-mix(in_oklab,var(--primary-background)_55%,transparent)] motion-safe:transition-[top] motion-safe:duration-700"
            style={{ top: percent(temperatureFraction(temperature, scale)) }}
          />
        )}
      </div>
      <div className="relative min-w-0 flex-1">
        {ticks
          .filter((tick) => temperature === null || Math.abs(temperatureFraction(tick, scale) - temperatureFraction(temperature, scale)) > 0.1)
          .map((tick) => (
            <span
              key={tick}
              aria-hidden="true"
              className="absolute -translate-y-1/2 whitespace-nowrap text-xs tabular-nums text-muted-foreground"
              style={{ top: percent(temperatureFraction(tick, scale)) }}
            >
              {formatTemperature(tick)}
            </span>
          ))}
        {temperature === null ? null : (
          <span
            aria-hidden="true"
            className="absolute -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--primary-background)] bg-[color-mix(in_oklab,var(--card-background)_90%,transparent)] px-1.5 py-0.5 text-xs font-semibold tabular-nums text-base-foreground motion-safe:transition-[top] motion-safe:duration-700"
            style={{
              top: percent(temperatureFraction(temperature, scale)),
              left: '0.25rem',
            }}
          >
            {formatTemperature(temperature)}
          </span>
        )}
      </div>
    </div>
  );
}
