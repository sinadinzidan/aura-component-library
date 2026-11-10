import { cn } from '../../../lib/utils';
import { formatReading } from '../../industrial/status';

import { profilePath, profilePoints, stopX } from './profileGeometry';

export type ProfileSeries = {
  id: string;
  label: string;
  unit: string;
  decimals?: number;
  /** One value per stop, in route order. */
  values: readonly number[];
};

export type ProfileRailProps = {
  /** Stop names, in route order. */
  stops: readonly string[];
  /** One or two profiles. Each is scaled to its own range, so their shapes compare, not their sizes. */
  series: readonly ProfileSeries[];
  activeIndex: number;
  onSelect?: (index: number) => void;
  /** Accessible name, e.g. "Pressure and temperature along the route". */
  label: string;
  className?: string;
};

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 96;
const BOX = { width: VIEW_WIDTH, height: VIEW_HEIGHT, paddingY: 12 };

/** Literal classes so Tailwind generates them: first profile solid, second dashed. */
const SERIES_STROKE = ['stroke-chart-1-450', 'stroke-chart-2-450'];
const SERIES_SWATCH = ['border-chart-1-450', 'border-dashed border-chart-2-450'];

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * The whole route in one glance: continuous profile lines (pressure, temperature…) across every
 * stop, with a cursor on the current stop and its values in the legend. Each stop is a column the
 * user can click to jump there. The second line is dashed, so the two read apart without colour.
 */
export function ProfileRail({ stops, series, activeIndex, onSelect, label, className }: ProfileRailProps) {
  const count = stops.length;
  const active = Math.min(Math.max(activeIndex, 0), Math.max(count - 1, 0));
  const cursorX = stopX(active, count, VIEW_WIDTH);
  const summary = series.map((entry) => `${entry.label} ${formatReading(entry.values[active], entry.unit, entry.decimals ?? 0)}`).join(', ');

  return (
    <div data-slot="profile-rail" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {series.map((entry, index) => (
          <span key={entry.id} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className={cn('w-5 border-t-2', SERIES_SWATCH[index % SERIES_SWATCH.length])} />
            {entry.label}
            <span data-slot="profile-value" className="text-sm font-medium text-base-foreground tabular-nums">
              {formatReading(entry.values[active], entry.unit, entry.decimals ?? 0)}
            </span>
            <span className="tabular-nums">
              route {formatReading(Math.min(...entry.values), undefined, entry.decimals ?? 0)}–{formatReading(Math.max(...entry.values), entry.unit, entry.decimals ?? 0)}
            </span>
          </span>
        ))}
      </div>

      <div className="relative w-full">
        <svg
          role="img"
          aria-label={`${label}. At ${stops[active] ?? 'the current stop'}: ${summary}`}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="block h-24 w-full overflow-visible"
          fill="none"
        >
          {stops.map((stop, index) => (
            <line
              key={stop}
              x1={stopX(index, count, VIEW_WIDTH)}
              x2={stopX(index, count, VIEW_WIDTH)}
              y1={0}
              y2={VIEW_HEIGHT}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="stroke-chart-neutral-100"
            />
          ))}
          <line
            data-slot="profile-cursor"
            x1={cursorX}
            x2={cursorX}
            y1={0}
            y2={VIEW_HEIGHT}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            className="stroke-[color:var(--primary-background)]"
          />
          {series.map((entry, index) => {
            const points = profilePoints(entry.values, BOX);
            const point = points[active];
            const stroke = SERIES_STROKE[index % SERIES_STROKE.length];
            return (
              <g key={entry.id}>
                <path
                  data-slot="profile-line"
                  d={profilePath(points, VIEW_WIDTH)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={index % 2 === 1 ? '6 4' : undefined}
                  vectorEffect="non-scaling-stroke"
                  className={stroke}
                />
                {point ? (
                  // A zero-length round stroke stays a round dot while the drawing stretches.
                  <path d={`M ${point.x} ${point.y} h 0.01`} strokeWidth={9} strokeLinecap="round" vectorEffect="non-scaling-stroke" className={stroke} />
                ) : null}
              </g>
            );
          })}
        </svg>
        {onSelect ? (
          <div className="absolute inset-0 grid grid-flow-col auto-cols-fr">
            {stops.map((stop, index) => (
              <button
                key={stop}
                type="button"
                aria-label={`Go to ${stop}`}
                aria-current={index === active ? 'step' : undefined}
                onClick={() => onSelect(index)}
                className="cursor-pointer rounded-md outline-none hover:bg-[color-mix(in_oklab,var(--primary-background)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div aria-hidden className="relative h-4 w-full text-xs text-muted-foreground">
        {stops.map((stop, index) => (
          <span
            key={stop}
            className={cn('absolute -translate-x-1/2 whitespace-nowrap', index === active ? 'font-medium text-base-foreground' : undefined)}
            style={{ left: percent((index + 0.5) / count) }}
          >
            {stop}
          </span>
        ))}
      </div>
    </div>
  );
}
