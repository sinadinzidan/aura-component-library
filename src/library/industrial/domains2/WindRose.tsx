import { cn } from '../../../lib/utils';
import { SCALE_TEXT, formatValue } from '../status';

import { bearingPoint, prevailingIndex, sectorBearing, sectorPath, valueRadius } from './polar';

export type WindRoseSector = {
  /** Compass direction the wind comes from: "N", "NE", … */
  direction: string;
  /** Share of time, energy or mean speed in this sector. */
  value: number;
};

export type WindRoseProps = {
  /** What the rose shows, e.g. "Wind direction, last 30 days". The prevailing direction is appended. */
  label: string;
  /** Equal sectors clockwise from north. */
  sectors: readonly WindRoseSector[];
  unit?: string;
  decimals?: number;
  /** Value at the outer ring. Defaults to the largest sector rounded up to a ring. */
  max?: number;
  /** Number of scale rings. */
  rings?: number;
  className?: string;
};

const CENTRE = 50;
const INNER = 6;
const OUTER = 38;
const LABEL_RADIUS = 46;

const percent = (value: number): string => `${Math.round(value * 100) / 100}%`;

function niceMax(value: number, rings: number): number {
  if (!(value > 0)) return rings;
  const step = Math.ceil(value / rings);
  return step * rings;
}

/**
 * Directional bars on a compass: how often, or how strongly, the wind comes from each sector.
 * One data colour; the prevailing sector is drawn strongest and named in words under the rose,
 * so the finding does not depend on reading angles.
 */
export function WindRose({ label, sectors, unit = '%', decimals = 0, max, rings = 3, className }: WindRoseProps) {
  const values = sectors.map((sector) => sector.value);
  const scaleMax = max ?? niceMax(Math.max(0, ...values), rings);
  const prevailing = prevailingIndex(values);
  const width = sectors.length > 0 ? (360 / sectors.length) * 0.78 : 0;
  const ringValues = Array.from({ length: rings }, (_, index) => (scaleMax * (index + 1)) / rings);
  const finding = prevailing === -1 ? 'no data' : `prevailing ${sectors[prevailing].direction}, ${formatValue(sectors[prevailing].value, decimals)} ${unit}`;

  return (
    <figure data-slot="wind-rose" className={cn('flex w-full min-w-0 flex-col items-center gap-3', className)}>
      <div className="relative aspect-square w-full max-w-64">
        <svg role="img" aria-label={`${label}: ${finding}`} viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {ringValues.map((ring) => (
            <circle key={ring} cx={CENTRE} cy={CENTRE} r={valueRadius(ring, scaleMax, INNER, OUTER)} fill="none" className="stroke-chart-gridlines" strokeWidth={0.4} />
          ))}
          {sectors.map((sector, index) => {
            const bearing = sectorBearing(index, sectors.length);
            const spoke = bearingPoint(CENTRE, CENTRE, OUTER, bearing);
            return <line key={sector.direction} x1={CENTRE} y1={CENTRE} x2={spoke.x} y2={spoke.y} className="stroke-chart-gridlines" strokeWidth={0.4} />;
          })}
          {sectors.map((sector, index) => (
            <path
              key={sector.direction}
              data-slot="wind-rose-sector"
              data-prevailing={index === prevailing ? 'true' : undefined}
              d={sectorPath(CENTRE, CENTRE, INNER, valueRadius(sector.value, scaleMax, INNER, OUTER), sectorBearing(index, sectors.length), width)}
              className={index === prevailing ? 'fill-chart-1-450' : 'fill-chart-1-300'}
            >
              <title>{`${sector.direction}: ${formatValue(sector.value, decimals)} ${unit}`}</title>
            </path>
          ))}
        </svg>
        {sectors.map((sector, index) => {
          const point = bearingPoint(CENTRE, CENTRE, LABEL_RADIUS, sectorBearing(index, sectors.length));
          return (
            <span
              key={sector.direction}
              aria-hidden
              className={cn('absolute -translate-x-1/2 -translate-y-1/2 text-xs leading-none', index === prevailing ? 'font-medium text-base-foreground' : 'text-muted-foreground')}
              style={{ left: percent(point.x), top: percent(point.y) }}
            >
              {sector.direction}
            </span>
          );
        })}
        {ringValues.map((ring) => {
          const point = bearingPoint(CENTRE, CENTRE, valueRadius(ring, scaleMax, INNER, OUTER), 22.5);
          return (
            <span key={ring} aria-hidden className={cn(SCALE_TEXT, 'absolute -translate-x-1/2 -translate-y-1/2 leading-none')} style={{ left: percent(point.x), top: percent(point.y) }}>
              {formatValue(ring, 0)}
            </span>
          );
        })}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {prevailing === -1 ? (
          'No data'
        ) : (
          <>
            Prevailing <span className="font-medium text-base-foreground">{sectors[prevailing].direction}</span>,{' '}
            <span className="tabular-nums">
              {formatValue(sectors[prevailing].value, decimals)} {unit}
            </span>
            . Rings in {unit}.
          </>
        )}
      </figcaption>
    </figure>
  );
}
