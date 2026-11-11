import { useLook } from '../../looks/useLook';
import { cx, formatNumber, niceTicks, type Tone } from '../tones';

export type ScaleMarker = {
  id: string;
  value: number;
  /** What the line is: "Current limit", "Proposed", "Trip". */
  label: string;
  tone: Tone;
  /** A proposal is drawn dashed. */
  dashed?: boolean;
  /** Which side of the track the caption sits on, so neighbours do not collide. */
  side?: 'above' | 'below';
};

export type ScaleBand = { id: string; from: number; to: number; tone: Tone; label: string };

type LimitScaleProps = {
  /** Accessible name, for example "Discharge temperature limits". */
  label: string;
  min: number;
  max: number;
  unit: string;
  decimals?: number;
  markers: readonly ScaleMarker[];
  /** Shaded ranges on the track: the normal operating range, a deadband. */
  bands?: readonly ScaleBand[];
  /** The live reading, drawn as a pointer on the track. */
  reading?: number;
  className?: string;
};

/**
 * A measurement range drawn to scale with its limits on it, the way they sit on a P&ID data
 * sheet: where the process normally runs, where the alarm is, where it is proposed to move, and
 * how much room is left before the trip. Captions carry the numbers; colour only groups them.
 */
export function LimitScale({ label, min, max, unit, decimals = 0, markers, bands = [], reading, className }: LimitScaleProps) {
  const look = useLook();
  const span = max - min || 1;
  const at = (value: number) => `${Math.min(100, Math.max(0, ((value - min) / span) * 100))}%`;
  const ticks = niceTicks(span, 5)
    .map((tick) => tick + min)
    .filter((tick) => tick <= max);
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'editorial';
  const above = markers.filter((marker) => (marker.side ?? 'above') === 'above');
  const below = markers.filter((marker) => marker.side === 'below');
  const summary = markers.map((marker) => `${marker.label} ${formatNumber(marker.value, decimals)} ${unit}`).join(', ');

  return (
    <div role="img" aria-label={`${label}: ${summary}`} data-look={look} className={cx('flex flex-col text-sm text-[var(--kit-text)]', className)}>
      <div className="relative h-12">
        {above.map((marker) => (
          <span key={marker.id} data-tone={marker.tone} style={{ left: at(marker.value) }} className="absolute bottom-1 flex -translate-x-1/2 flex-col items-center leading-4 whitespace-nowrap">
            <span className="text-xs font-medium text-[var(--kit-text-2)]">{marker.label}</span>
            <span className="font-semibold text-[var(--t-ink)] tabular-nums">
              {formatNumber(marker.value, decimals)} {unit}
            </span>
          </span>
        ))}
      </div>
      <div className={cx('relative h-7 bg-[var(--kit-track)]', square ? '' : 'rounded-[var(--kit-radius-sm)]', look === 'blueprint' || look === 'poster' ? 'border border-[var(--kit-text)]' : '')}>
        {bands.map((band) => (
          <span
            key={band.id}
            data-tone={band.tone}
            title={band.label}
            style={{ left: at(band.from), width: `calc(${at(band.to)} - ${at(band.from)})` }}
            className="absolute inset-y-0 bg-[color-mix(in_oklab,var(--t-line)_30%,transparent)]"
          />
        ))}
        {markers.map((marker) => (
          <span
            key={marker.id}
            data-tone={marker.tone}
            data-marker={marker.id}
            style={{ left: at(marker.value) }}
            className={cx('absolute -inset-y-1.5 -translate-x-1/2 border-l-2 border-[var(--t-line)]', marker.dashed ? 'border-dashed' : '')}
          />
        ))}
        {reading === undefined ? null : (
          <span style={{ left: at(reading) }} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-[var(--kit-surface)] bg-[var(--kit-text)]" />
        )}
      </div>
      <div className="relative h-5 border-t border-[var(--kit-rule-strong)]">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: at(tick) }} className="absolute top-0 flex -translate-x-1/2 flex-col items-center text-xs text-[var(--kit-text-2)] tabular-nums">
            <span className="h-1.5 w-px bg-[var(--kit-rule-strong)]" />
            {formatNumber(tick, decimals)}
          </span>
        ))}
      </div>
      <div className="relative h-11">
        {below.map((marker) => (
          <span key={marker.id} data-tone={marker.tone} style={{ left: at(marker.value) }} className="absolute top-2 flex -translate-x-1/2 flex-col items-center leading-4 whitespace-nowrap">
            <span className="font-semibold text-[var(--t-ink)] tabular-nums">
              {formatNumber(marker.value, decimals)} {unit}
            </span>
            <span className="text-xs font-medium text-[var(--kit-text-2)]">{marker.label}</span>
          </span>
        ))}
      </div>
      {bands.length > 0 || reading !== undefined ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--kit-text-2)]">
          {bands.map((band) => (
            <li key={band.id} data-tone={band.tone} className="flex items-center gap-1.5">
              <span className="size-2.5 bg-[color-mix(in_oklab,var(--t-line)_45%,transparent)]" />
              {band.label}
            </li>
          ))}
          {reading === undefined ? null : (
            <li className="flex items-center gap-1.5">
              <span className="size-2 rotate-45 bg-[var(--kit-text)]" />
              Reading {formatNumber(reading, decimals)} {unit}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
