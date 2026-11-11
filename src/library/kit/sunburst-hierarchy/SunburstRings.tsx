import { useId } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { arcLength, arcLinePath, arcPath, partition, shapeArcs, type ArcShape } from '../../experiences/drilldown/sunburstLayout';
import { useLook } from '../../looks/useLook';
import { cx, toneLine, type Tone } from '../tones';

import { SUNBURST_SIZE, fittingLabel, labelFontSize } from './sunburstLabel';

export type SunburstDatum = {
  id: string;
  /** Printed along the arc when it fits. */
  label: string;
  /** A shorter label to fall back to on a narrow arc. */
  short?: string;
  /** Read out and shown as the native tooltip: name, figure and state. */
  title: string;
  tone: Tone;
  /** `alert` fills the arc solid in its tone; `normal` tints it, lighter with every ring. */
  emphasis?: 'normal' | 'alert';
  /** Angle share of a leaf. Branches take the sum of their leaves. */
  weight: number;
  children: readonly SunburstDatum[];
};

type SunburstRingsProps = {
  /** What the chart shows, in words. */
  label: string;
  /** The node in the middle; its descendants fill the rings. */
  root: SunburstDatum;
  /** Rings to draw below the root. */
  maxDepth?: number;
  selectedId?: string | null;
  onPick?: (id: string) => void;
  /** Content of the centre disc: the name and figure of the root, usually a button that steps out. */
  center?: ReactNode;
  /** Share of the radius the centre disc takes, 0–1. */
  hole?: number;
  /** Width in px the chart is drawn at, so arc labels never render under 12 px. */
  displaySize?: number;
  className?: string;
};

const SIZE = SUNBURST_SIZE;
const CENTER = SIZE / 2;
const OUTER = SIZE / 2 - 10;

type Drawn = { shape: ArcShape; datum: SunburstDatum };

function flatten(root: SunburstDatum): Map<string, SunburstDatum> {
  const map = new Map<string, SunburstDatum>();
  const visit = (datum: SunburstDatum) => {
    map.set(datum.id, datum);
    datum.children.forEach(visit);
  };
  visit(root);
  return map;
}

/**
 * A sunburst: the root in the middle, each ring one level further down, every arc as wide as the
 * weight below it. Arcs are buttons — pick one to zoom or select. Gaps are real, so the canvas of
 * the look shows through; glass adds a glow to alert arcs and to the selection.
 */
export function SunburstRings({ label, root, maxDepth = 3, selectedId, onPick, center, hole = 0.3, displaySize = SUNBURST_SIZE, className }: SunburstRingsProps) {
  const look = useLook();
  const pathId = useId().replace(/:/g, '');
  const byId = flatten(root);
  const inner = OUTER * hole;
  const arcs = partition(root, {
    id: (datum) => datum.id,
    children: (datum) => datum.children,
    weight: (datum) => datum.weight,
    maxDepth,
  });
  const shapes = shapeArcs(arcs, { inner: inner + 6, outer: OUTER, gap: 4 });
  const drawn: Drawn[] = shapes.flatMap((shape) => {
    const datum = byId.get(shape.id);
    return datum ? [{ shape, datum }] : [];
  });
  const rings = Math.max(1, ...shapes.map((shape) => shape.depth));
  const glow = look === 'glass';
  const font = labelFontSize(displaySize);

  const onKeyDown = (event: KeyboardEvent<SVGPathElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPick?.(id);
  };

  return (
    <div data-look={look} className={cx('relative aspect-square w-full', className)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label={label} className="block h-full w-full">
        {drawn.map(({ shape, datum }) => {
          const mid = (shape.r0 + shape.r1) / 2;
          // Trim both ends by a fixed arc length so the gap is the same width on every ring.
          const pad = Math.min(2 / mid, (shape.end - shape.start) / 4);
          const start = shape.start + pad;
          const end = shape.end - pad;
          const alert = datum.emphasis === 'alert';
          const selected = datum.id === selectedId;
          const strength = alert ? 100 : Math.max(34, 76 - (shape.depth - 1) * (rings > 2 ? 20 : 26));
          const text = fittingLabel(datum, arcLength({ ...shape, start, end }), shape.r1 - shape.r0, font);
          const line = toneLine(datum.tone);
          return (
            <g key={datum.id} data-tone={datum.tone} data-arc={datum.id} data-emphasis={alert ? 'alert' : 'normal'}>
              <path
                d={arcPath(CENTER, CENTER, shape.r0, shape.r1, start, end)}
                role="button"
                tabIndex={0}
                aria-label={datum.title}
                aria-pressed={selected}
                onClick={() => onPick?.(datum.id)}
                onKeyDown={(event) => onKeyDown(event, datum.id)}
                fill={alert ? 'var(--t-pop)' : `color-mix(in oklab, ${line} ${strength}%, transparent)`}
                stroke={selected ? 'var(--kit-text)' : 'none'}
                strokeWidth={selected ? 3 : 0}
                style={{ filter: glow && (alert || selected) ? `drop-shadow(0 0 ${selected ? 14 : 8}px ${line})` : undefined }}
                className="cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
              >
                <title>{datum.title}</title>
              </path>
              {text ? (
                <>
                  <path id={`${pathId}-${datum.id}`} d={arcLinePath(CENTER, CENTER, mid, start, end)} fill="none" />
                  <text
                    fontSize={font}
                    fontWeight={600}
                    dominantBaseline="central"
                    fill={alert ? 'var(--t-on-pop)' : 'var(--kit-text)'}
                    className="pointer-events-none tabular-nums"
                  >
                    <textPath href={`#${pathId}-${datum.id}`} startOffset="50%" textAnchor="middle">
                      {text}
                    </textPath>
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
      {center ? (
        <div
          className="pointer-events-none absolute flex items-center justify-center [&>*]:pointer-events-auto"
          style={{ inset: `${50 - (inner / SIZE) * 100}%` }}
        >
          {center}
        </div>
      ) : null}
    </div>
  );
}
