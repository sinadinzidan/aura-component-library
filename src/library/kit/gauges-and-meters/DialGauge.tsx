import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { rangeShare } from './limits';

export type DialZone = { from: number; to: number; tone: Tone };

type DialGaugeProps = {
  /** What is measured; shown under the dial and used as the accessible name. */
  label: string;
  /** `null` draws the empty dial with a dash: the signal is lost or bad. */
  value: number | null;
  min?: number;
  max: number;
  unit?: string;
  decimals?: number;
  /** Limit zones drawn on the scale, for example high and trip. */
  zones?: readonly DialZone[];
  /** A marker for the setpoint or target. */
  setpoint?: number;
  tone?: Tone;
  /** `arc` fills the scale up to the value; `needle` points at it on a zoned scale. Leave out to let the look choose. */
  variant?: 'arc' | 'needle';
  /** Diameter in px. */
  size?: number;
  /** Number of labelled ticks around the scale; leave out for min and max only. */
  ticks?: number;
  /** Under the label: the state pill, the tag. */
  caption?: ReactNode;
  hideLabel?: boolean;
  className?: string;
};

const START = 135;
const SWEEP = 270;

function polar(ox: number, oy: number, radius: number, degrees: number): readonly [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [ox + radius * Math.cos(radians), oy + radius * Math.sin(radians)];
}

function arc(ox: number, oy: number, radius: number, from: number, to: number): string {
  const [x1, y1] = polar(ox, oy, radius, from);
  const [x2, y2] = polar(ox, oy, radius, to);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * A value on a 270° scale with its limit zones and setpoint: the instrument-panel gauge. The look
 * sets the anatomy — a thick rounded arc in soft, a hairline scale with a needle on a blueprint, a
 * glowing thin arc in glass, square blocks of arc in poster and console.
 */
export function DialGauge({
  label,
  value,
  min = 0,
  max,
  unit,
  decimals = 0,
  zones = [],
  setpoint,
  tone = 'accent',
  variant,
  size = 160,
  ticks,
  caption,
  hideLabel = false,
  className,
}: DialGaugeProps) {
  const { id: look, chart } = useLookDefinition();
  const mode = variant ?? (look === 'blueprint' || look === 'editorial' ? 'needle' : 'arc');
  const hairline = mode === 'needle' && (look === 'blueprint' || look === 'editorial');
  const hasTicks = ticks !== undefined && ticks > 1;
  const zoneRing = zones.length > 0 && mode === 'arc';
  const margin = hasTicks ? (zoneRing ? 34 : 30) : zones.length > 0 ? 10 : 4;
  const radiusOuter = size / 2 - margin;
  const arcWidth = Math.max(3, Math.min(radiusOuter * chart.ring, radiusOuter * 0.34));
  const width = mode === 'needle' ? Math.max(arcWidth, 7) : arcWidth;
  const radius = radiusOuter - width / 2;
  const ox = size / 2;
  const oy = size / 2;
  const angle = (point: number) => START + rangeShare(point, min, max) * SWEEP;
  const cap = chart.barRadius === 0 ? 'butt' : 'round';
  const bottom = oy + radiusOuter * Math.sin(Math.PI / 4) + (hasTicks ? 30 : 24);
  const height = Math.min(size, Math.ceil(bottom));
  const shown = value === null ? '—' : formatNumber(value, decimals);
  const tickValues = hasTicks ? Array.from({ length: ticks }, (_, index) => min + ((max - min) * index) / (ticks - 1)) : [];
  const [minX, minY] = polar(ox, oy, radius, START);
  const [maxX] = polar(ox, oy, radius, START + SWEEP);
  const needleTip = value === null ? null : polar(ox, oy, radius - width / 2 - 5, angle(value));
  const figureSize = mode === 'needle' ? Math.max(16, size * 0.13) : Math.max(16, size * 0.19);

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'No data' : `${shown}${unit ? ` ${unit}` : ''}`}
      data-look={look}
      data-tone={value === null ? 'neutral' : tone}
      data-variant={mode}
      className={cx('inline-flex min-w-0 flex-col items-center gap-2 text-(--kit-text)', className)}
    >
      <div className="relative shrink-0" style={{ width: size, height }}>
        <svg viewBox={`0 0 ${size} ${height}`} width={size} height={height} aria-hidden="true" fill="none" className="absolute inset-0 overflow-visible">
          <path
            d={arc(ox, oy, radius, START, START + SWEEP)}
            stroke={hairline ? 'color-mix(in oklab, var(--kit-text) 24%, transparent)' : 'var(--kit-track)'}
            strokeWidth={width}
            strokeLinecap={cap}
          />
          {zones.map((zone) =>
            mode === 'needle' ? (
              <path key={`${zone.from}-${zone.to}`} data-tone={zone.tone} d={arc(ox, oy, radius, angle(zone.from), angle(zone.to))} stroke="var(--t-line)" strokeWidth={width} />
            ) : (
              <path key={`${zone.from}-${zone.to}`} data-tone={zone.tone} d={arc(ox, oy, radiusOuter + 5, angle(zone.from), angle(zone.to))} stroke="var(--t-line)" strokeWidth="3" />
            )
          )}
          {mode === 'arc' && value !== null && value > min ? (
            <path
              d={arc(ox, oy, radius, START, angle(value))}
              stroke="var(--t-line)"
              strokeWidth={width}
              strokeLinecap={cap}
              style={look === 'glass' ? { filter: 'drop-shadow(0 0 6px var(--t-line))' } : undefined}
            />
          ) : null}
          {tickValues.map((tick) => {
            const degrees = angle(tick);
            const [x1, y1] = polar(ox, oy, radiusOuter + (zoneRing ? 10 : 3), degrees);
            const [x2, y2] = polar(ox, oy, radiusOuter + (zoneRing ? 15 : 8), degrees);
            const [tx, ty] = polar(ox, oy, radiusOuter + (zoneRing ? 26 : 20), degrees);
            return (
              <g key={tick}>
                <path d={`M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`} stroke="var(--kit-rule-strong)" strokeWidth="1.25" />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--kit-text-3)" className="tabular-nums">
                  {formatNumber(tick, tick % 1 === 0 ? 0 : 1)}
                </text>
              </g>
            );
          })}
          {setpoint !== undefined ? (
            <path
              d={`M${polar(ox, oy, radius - width / 2 - 3, angle(setpoint))
                .map((point) => point.toFixed(2))
                .join(' ')}L${polar(ox, oy, radius + width / 2 + 3, angle(setpoint))
                .map((point) => point.toFixed(2))
                .join(' ')}`}
              stroke="var(--kit-text)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : null}
          {mode === 'needle' && needleTip ? (
            <g>
              <path d={`M${ox} ${oy}L${needleTip[0].toFixed(2)} ${needleTip[1].toFixed(2)}`} stroke="var(--t-line)" strokeWidth="3" strokeLinecap="round" />
              <circle cx={ox} cy={oy} r="6" fill="var(--kit-halo)" stroke="var(--kit-text)" strokeWidth="2" />
            </g>
          ) : null}
          {hasTicks ? null : (
            <g fontSize="12" fill="var(--kit-text-3)" className="tabular-nums">
              <text x={minX} y={minY + width / 2 + 16} textAnchor="middle">
                {formatNumber(min, 0)}
              </text>
              <text x={maxX} y={minY + width / 2 + 16} textAnchor="middle">
                {formatNumber(max, 0)}
              </text>
            </g>
          )}
        </svg>
        <div
          className={cx('pointer-events-none absolute inset-x-0 flex flex-col items-center leading-none', mode === 'needle' ? 'bottom-0' : '')}
          style={mode === 'needle' ? { bottom: hasTicks ? 0 : 20 } : { top: oy, transform: 'translateY(-50%)' }}
        >
          <span
            className="tabular-nums"
            style={{ fontSize: figureSize, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)', color: value === null ? 'var(--kit-text-3)' : undefined }}
          >
            {shown}
          </span>
          {unit ? <span className="mt-1 text-xs font-medium text-(--kit-text-3)">{unit}</span> : null}
        </div>
      </div>
      {hideLabel ? null : <span className="max-w-full text-center text-sm font-medium text-(--kit-text-2)">{label}</span>}
      {caption}
    </div>
  );
}
