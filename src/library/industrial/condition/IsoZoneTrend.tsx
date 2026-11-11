import { cn } from '../../../lib/utils';
import { TONE_TEXT, formatValue } from '../status';

import { ISO_ZONE_TONE, isoZone, isoZoneBands } from './isoZones';
import type { IsoBoundaries, IsoZone } from './isoZones';
import { PlotFrame } from './PlotFrame';
import { niceCeiling, polylinePoints } from './plotScale';

export type IsoTrendPoint = { t: number; v: number };

export type IsoZoneTrendProps = {
  /** What the trend shows, with the key finding. Becomes the accessible name. */
  label: string;
  /** Overall velocity in mm/s RMS, oldest first. */
  points: readonly IsoTrendPoint[];
  boundaries: IsoBoundaries;
  /** Upper end of the velocity axis. Defaults to a round value above the data and the C/D boundary. */
  max?: number;
  /** Labels for the time axis. */
  formatTime: (timestamp: number) => string;
  /** Number of time labels. */
  timeTicks?: number;
  heightClassName?: string;
  className?: string;
};

const ZONE_FILL: Record<IsoZone, string> = {
  A: 'fill-transparent',
  B: 'fill-chart-neutral-100',
  C: 'fill-chart-warning-100',
  D: 'fill-chart-critical-100',
};

/**
 * Overall vibration velocity over time against the ISO 10816 evaluation zones. The bands are
 * lettered as well as shaded — A and B stay neutral, C is a warning, D is damaging — and the
 * latest value is called out with its zone.
 */
export function IsoZoneTrend({ label, points, boundaries, max, formatTime, timeTicks = 5, heightClassName = 'h-56', className }: IsoZoneTrendProps) {
  const top = max ?? niceCeiling(Math.max(boundaries.cd * 1.25, ...points.map((point) => point.v)), 1.05);
  const first = points[0]?.t ?? 0;
  const last = points[points.length - 1];
  const end = last?.t ?? 1;
  const bands = isoZoneBands(boundaries, top);
  const ticks = Array.from({ length: timeTicks }, (_, index) => first + ((end - first) * index) / Math.max(1, timeTicks - 1));
  const latestZone = last ? isoZone(last.v, boundaries) : null;

  return (
    <PlotFrame
      label={label}
      x={{ domain: [first, end], ticks, format: formatTime }}
      y={{ domain: [0, top], ticks: [0, boundaries.ab, boundaries.bc, boundaries.cd].filter((tick) => tick <= top), title: 'Overall velocity, mm/s RMS', format: (value) => formatValue(value, Number.isInteger(value) ? 0 : 1) }}
      grid={false}
      heightClassName={heightClassName}
      className={className}
      overlay={(scale) => (
        <>
          {bands.map((band) => (
            <span
              key={band.zone}
              data-slot="iso-zone-label"
              className={cn('absolute left-1.5 -translate-y-1/2 text-xs font-semibold leading-none', ISO_ZONE_TONE[band.zone] === 'neutral' ? 'text-muted-foreground' : TONE_TEXT[ISO_ZONE_TONE[band.zone]])}
              style={{ top: `${scale.y((band.from + band.to) / 2)}%` }}
            >
              {band.zone}
            </span>
          ))}
          {last && latestZone ? (
            <span
              data-slot="iso-latest"
              className="absolute right-0 flex -translate-y-full items-baseline gap-1 whitespace-nowrap rounded-xs bg-base-background px-1 pb-1 text-xs leading-none tabular-nums"
              style={{ top: `${scale.y(last.v)}%` }}
            >
              <span className="font-medium text-base-foreground">{formatValue(last.v, 1)}</span>
              <span className={ISO_ZONE_TONE[latestZone] === 'neutral' ? 'text-muted-foreground' : TONE_TEXT[ISO_ZONE_TONE[latestZone]]}>zone {latestZone}</span>
            </span>
          ) : null}
          {last ? <span className="absolute right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1-450" style={{ top: `${scale.y(last.v)}%` }} /> : null}
        </>
      )}
    >
      {(scale) => (
        <>
          {bands.map((band) => (
            <rect key={band.zone} data-slot="iso-zone-band" data-zone={band.zone} x={0} width={100} y={scale.y(band.to)} height={scale.y(band.from) - scale.y(band.to)} className={ZONE_FILL[band.zone]} />
          ))}
          {[boundaries.ab, boundaries.bc, boundaries.cd].filter((value) => value < top).map((value) => (
            <line key={value} x1={0} x2={100} y1={scale.y(value)} y2={scale.y(value)} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />
          ))}
          <polyline data-slot="iso-trend-line" points={polylinePoints(points.map((point) => point.t), points.map((point) => point.v), scale)} strokeWidth={1.75} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
        </>
      )}
    </PlotFrame>
  );
}
