import { cn } from '../../../lib/utils';
import { HEAT_LEVEL_BG } from '../charts/heatLevels';
import { HeatScaleLegend } from '../charts/HeatScaleLegend';
import { formatValue } from '../status';

import { thermalGrid } from './thermal';
import type { HeatSpot } from './thermal';

export type ThermalFrameProps = {
  /** What the image shows, with its hottest finding. Becomes the accessible name. */
  label: string;
  spots: readonly HeatSpot[];
  /** Colour scale in °C. */
  min: number;
  max: number;
  ambient: number;
  /** Spots with a printed temperature readout over the image. */
  readouts?: readonly string[];
  /** Id of a spot to ring, e.g. the one selected in a list. */
  highlightId?: string | null;
  className?: string;
};

const COLUMNS = 32;
const ROWS = 18;

/**
 * A thermal-camera frame built from the heat-map tokens: a coarse temperature field in the four
 * heat steps, spot markers with their readouts, and a scale below. Four steps are all the tokens
 * offer, so the scale prints the edge of each step.
 */
export function ThermalFrame({ label, spots, min, max, ambient, readouts = [], highlightId = null, className }: ThermalFrameProps) {
  const grid = thermalGrid(spots, { columns: COLUMNS, rows: ROWS, ambient, min, max });

  return (
    <div data-slot="thermal-frame" className={cn('flex w-full flex-col gap-2', className)}>
      <div role="img" aria-label={label} className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted-background">
        <div aria-hidden="true" className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
          {grid.flat().map((step, index) => (
            <span key={index} className={HEAT_LEVEL_BG[step]} />
          ))}
        </div>
        {spots.map((spot) => (
          <span
            key={spot.id}
            data-slot="thermal-spot"
            aria-hidden="true"
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
            style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
          >
            <span className={cn('size-3 rounded-full border-2 border-base-foreground', highlightId === spot.id && 'size-4 outline-2 outline-offset-2 outline-[var(--primary-background)]')} />
            {readouts.includes(spot.id) ? (
              <span className="rounded-xs bg-[color-mix(in_oklab,var(--card-background)_85%,transparent)] px-1 py-0.5 font-mono text-xs leading-none tabular-nums text-base-foreground">
                {spot.label} {formatValue(spot.peak, 1)} °C
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <HeatScaleLegend lowLabel={`${formatValue(min, 0)} °C`} highLabel={`${formatValue(max, 0)} °C`} title="Surface temperature" />
    </div>
  );
}
