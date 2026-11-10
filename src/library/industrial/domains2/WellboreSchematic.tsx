import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { SCALE_TEXT, formatValue } from '../status';

import { spreadPositions } from './labelLayout';

export type WellboreCasing = {
  /** Size and kind: "13⅜ in surface casing". */
  label: string;
  /** Depth of the casing shoe. */
  shoeDepth: number;
};

export type WellborePerforation = { top: number; bottom: number };

export type WellboreSchematicProps = {
  /** Well name, for the accessible name. */
  label: string;
  /** Depth of the bottom of the drawing. */
  totalDepth: number;
  /** Outermost first. Each casing is drawn narrower than the one before. */
  casings: readonly WellboreCasing[];
  /** Depth of the end of the production tubing. */
  tubingDepth: number;
  /** Depth of the production packer between tubing and casing. */
  packerDepth?: number;
  perforations?: readonly WellborePerforation[];
  /** Distance between depth ticks. */
  tickEvery?: number;
  /** Depth unit, e.g. "m MD". */
  unit?: string;
  /** Tailwind height of the drawing. */
  heightClassName?: string;
  className?: string;
};

/** Half-widths in a 0–100 viewBox: casings step inwards, the tubing is the innermost string. */
const CASING_HALF_WIDTHS = [42, 32, 23, 15];
const TUBING_HALF_WIDTH = 6;
const CENTRE = 50;
/** Smallest distance between two labels, in percent of the drawing height. */
const LABEL_GAP = 6.5;

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * A wellbore drawn to a depth scale: casing strings with their shoes, production tubing, packer
 * and perforated intervals. Deliberately schematic — widths are not to scale, depths are. Labels
 * are HTML beside the drawing, so they keep their size in every theme and can be selected.
 */
export function WellboreSchematic({
  label,
  totalDepth,
  casings,
  tubingDepth,
  packerDepth,
  perforations = [],
  tickEvery = 500,
  unit = 'm MD',
  heightClassName = 'h-80',
  className,
}: WellboreSchematicProps) {
  const y = (depth: number): number => toFraction(depth, 0, totalDepth) * 100;
  const drawn = casings.slice(0, CASING_HALF_WIDTHS.length);
  const innermost = CASING_HALF_WIDTHS[Math.max(0, drawn.length - 1)];
  const ticks = Array.from({ length: Math.floor(totalDepth / tickEvery) + 1 }, (_, index) => index * tickEvery);
  const notes = [
    ...drawn.map((casing) => ({ key: casing.label, depth: casing.shoeDepth, text: casing.label })),
    ...(packerDepth === undefined ? [] : [{ key: 'packer', depth: packerDepth, text: 'Production packer' }]),
    { key: 'tubing', depth: tubingDepth, text: 'Tubing end' },
    ...perforations.map((interval, index) => ({
      key: `perforation-${index}`,
      depth: (interval.top + interval.bottom) / 2,
      text: `Perforations ${formatValue(interval.top, 0)}–${formatValue(interval.bottom, 0)}`,
    })),
  ].sort((a, b) => a.depth - b.depth);
  // Labels sit at their depth, moved apart just enough to stay readable where depths are close.
  const noteTops = spreadPositions(
    notes.map((note) => (note.depth / totalDepth) * 100),
    LABEL_GAP
  );
  const name = `Wellbore schematic of ${label}: ${drawn.length} casing strings, tubing to ${formatValue(tubingDepth, 0)} ${unit}, ${perforations.length} perforated ${
    perforations.length === 1 ? 'interval' : 'intervals'
  }, total depth ${formatValue(totalDepth, 0)} ${unit}`;

  return (
    <figure data-slot="wellbore-schematic" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className={cn('grid w-full grid-cols-[auto_minmax(4rem,7rem)_minmax(0,1fr)] gap-x-3 py-2', heightClassName)}>
        <div aria-hidden className="relative w-12">
          {ticks.map((tick) => (
            <span key={tick} className={cn(SCALE_TEXT, 'absolute right-0 -translate-y-1/2 leading-none')} style={{ top: percent(tick / totalDepth) }}>
              {formatValue(tick, 0)}
            </span>
          ))}
        </div>

        <svg role="img" aria-label={name} viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {ticks.map((tick) => (
            <line key={tick} x1={0} x2={100} y1={y(tick)} y2={y(tick)} vectorEffect="non-scaling-stroke" className="stroke-chart-gridlines" />
          ))}
          {drawn.map((casing, index) => {
            const half = CASING_HALF_WIDTHS[index];
            const shoe = y(casing.shoeDepth);
            return (
              <g key={casing.label} data-slot="wellbore-casing">
                <line x1={CENTRE - half} x2={CENTRE - half} y1={0} y2={shoe} vectorEffect="non-scaling-stroke" strokeWidth={2} className="stroke-chart-neutral-450" />
                <line x1={CENTRE + half} x2={CENTRE + half} y1={0} y2={shoe} vectorEffect="non-scaling-stroke" strokeWidth={2} className="stroke-chart-neutral-450" />
                <polygon points={`${CENTRE - half},${shoe} ${CENTRE - half - 4},${shoe} ${CENTRE - half},${shoe - 2.5}`} className="fill-chart-neutral-450" />
                <polygon points={`${CENTRE + half},${shoe} ${CENTRE + half + 4},${shoe} ${CENTRE + half},${shoe - 2.5}`} className="fill-chart-neutral-450" />
              </g>
            );
          })}
          <rect
            data-slot="wellbore-tubing"
            x={CENTRE - TUBING_HALF_WIDTH}
            width={TUBING_HALF_WIDTH * 2}
            y={0}
            height={y(tubingDepth)}
            vectorEffect="non-scaling-stroke"
            className="fill-chart-1-100 stroke-chart-1-450"
          />
          {packerDepth === undefined ? null : (
            <g data-slot="wellbore-packer">
              <rect x={CENTRE - innermost} width={innermost - TUBING_HALF_WIDTH} y={y(packerDepth) - 1} height={2} className="fill-base-foreground" />
              <rect x={CENTRE + TUBING_HALF_WIDTH} width={innermost - TUBING_HALF_WIDTH} y={y(packerDepth) - 1} height={2} className="fill-base-foreground" />
            </g>
          )}
          {perforations.map((interval) => (
            <g key={interval.top} data-slot="wellbore-perforation">
              <rect x={CENTRE - innermost - 7} width={7} y={y(interval.top)} height={y(interval.bottom) - y(interval.top)} className="fill-chart-1-450" />
              <rect x={CENTRE + innermost} width={7} y={y(interval.top)} height={y(interval.bottom) - y(interval.top)} className="fill-chart-1-450" />
            </g>
          ))}
        </svg>

        <ul className="relative min-w-0">
          {notes.map((note, index) => (
            <li key={note.key} className="absolute left-0 flex -translate-y-1/2 items-baseline gap-2 whitespace-nowrap text-xs leading-none" style={{ top: percent(noteTops[index] / 100) }}>
              <span className="text-base-foreground">{note.text}</span>
              <span className="tabular-nums text-muted-foreground">{formatValue(note.depth, 0)} m</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className={SCALE_TEXT}>Depth in {unit}. Widths are not to scale.</figcaption>
    </figure>
  );
}
