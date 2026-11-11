import { useEffect, useRef, useState } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { axisSteps, crossingAt, deepestPoint, furthestPoint, horizonLabelSide, sectionFrame, sectionPath } from './sectionGeometry';
import type { SectionPoint, SectionSize } from './sectionGeometry';

export type WellSectionHorizon = { id: string; name: string; points: readonly SectionPoint[] };

export type WellSectionMark = SectionPoint & {
  id: string;
  label: string;
  /** `shoe` is a casing shoe, `kickoff` where the well leaves vertical, `td` its total depth. */
  kind: 'shoe' | 'kickoff' | 'td';
};

type WellSectionProps = {
  /** What the drawing shows, in words. */
  label: string;
  /** The well path along the section, wellhead first. */
  path: readonly SectionPoint[];
  /** Geological surfaces along the same section, shallowest first. */
  horizons?: readonly WellSectionHorizon[];
  /** The interval to shade, by the ids of the horizons above and below it. */
  band?: { topId: string; baseId: string; label: string };
  marks?: readonly WellSectionMark[];
  /** A horizontal reference depth, for example a cutting plane shared with a 3D view. */
  plane?: { tvd: number; label: string };
  /** Extent of the drawing in metres. Keep it fixed across wells so the scale does not jump. */
  maxDeparture: number;
  maxDepth: number;
  /** Grid spacing in metres. */
  step?: number;
  /** Fixed drawing size in px. Leave out to fill the parent, which then needs a height. */
  size?: SectionSize;
  className?: string;
};

const MARGIN = { top: 44, right: 56, bottom: 58, left: 52 };
const FALLBACK_SIZE: SectionSize = { width: 480, height: 520 };
const TEXT = 'fill-[var(--kit-text)] text-xs tabular-nums';
const QUIET_TEXT = 'fill-[var(--kit-text-2)] text-xs tabular-nums';
/** Paper-coloured outline behind a label, so lines passing under it do not strike it through. */
const HALO = { paintOrder: 'stroke', stroke: 'var(--kit-halo)', strokeWidth: 4, strokeLinejoin: 'round' } as const;

/**
 * A vertical section of one well, drawn to true scale like an engineering drawing: depth down,
 * departure out, horizons as thin lines, casing shoes and kick-off as marks with leaders, and
 * dimension lines for the departure and depth it reaches. Line only, one ink and one accent for
 * the reference plane. It measures its parent and draws in real pixels, so text never shrinks.
 */
export function WellSection({ label, path, horizons = [], band, marks = [], plane, maxDeparture, maxDepth, step = 500, size, className }: WellSectionProps) {
  const look = useLook();
  const host = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<SectionSize | null>(null);

  useEffect(() => {
    const element = host.current;
    if (size || !element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setMeasured({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [size]);

  const drawing = size ?? measured ?? FALLBACK_SIZE;
  const frame = sectionFrame(drawing, MARGIN, maxDeparture, maxDepth);
  const { plot, x, y } = frame;
  const right = plot.left + plot.width;
  const bottom = plot.top + plot.height;
  const deepest = deepestPoint(path);
  const furthest = furthestPoint(path);
  const top = band ? horizons.find((horizon) => horizon.id === band.topId) : undefined;
  const base = band ? horizons.find((horizon) => horizon.id === band.baseId) : undefined;
  const crossing = plane ? crossingAt(path, plane.tvd) : null;
  const bandPath = top && base ? `${sectionPath(top.points, frame)} ${sectionPath([...base.points].reverse(), frame).replace('M', 'L')} Z` : '';

  return (
    <div ref={host} data-look={look} data-slot="well-section" className={cx('relative h-full min-h-0 w-full overflow-hidden', className)}>
      <svg role="img" aria-label={label} width={drawing.width} height={drawing.height} className="absolute left-0 top-0 block">
        {/* Grid and axes */}
        {axisSteps(maxDepth, step).map((depth) => (
          <g key={`d${depth}`}>
            <line x1={plot.left} x2={right} y1={y(depth)} y2={y(depth)} stroke="var(--kit-rule)" strokeWidth={1} />
            <text x={plot.left - 8} y={y(depth) + 4} textAnchor="end" className={QUIET_TEXT}>
              {formatNumber(depth)}
            </text>
          </g>
        ))}
        {axisSteps(maxDeparture, step).map((departure) => (
          <g key={`x${departure}`}>
            <line x1={x(departure)} x2={x(departure)} y1={plot.top} y2={bottom} stroke="var(--kit-rule)" strokeWidth={1} />
            {departure % (step * 2) === 0 ? (
              <text x={x(departure)} y={bottom + 18} textAnchor="middle" className={QUIET_TEXT}>
                {formatNumber(departure)}
              </text>
            ) : null}
          </g>
        ))}
        <rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} fill="none" stroke="var(--kit-rule-strong)" strokeWidth={1} />

        {/* Seabed: a heavier line with hatching above the wellhead datum */}
        <line x1={plot.left} x2={right} y1={plot.top} y2={plot.top} stroke="var(--kit-rule-strong)" strokeWidth={2.5} />

        {/* Shaded interval and horizons */}
        {bandPath ? <path d={bandPath} fill="color-mix(in oklab, var(--kit-text) 9%, transparent)" /> : null}
        {horizons.map((horizon) => {
          const start = horizon.points[0];
          const end = horizon.points[horizon.points.length - 1];
          // Name the surface at the end the well stays clear of: where the path crosses it far out, the name moves to the wellhead side.
          const atStart = horizonLabelSide(path, start?.tvd ?? 0, maxDeparture) === 'start';
          const anchor = atStart ? start : end;
          return (
            <g key={horizon.id}>
              <path d={sectionPath(horizon.points, frame)} fill="none" stroke="var(--kit-text)" strokeWidth={1} strokeDasharray="10 3 2 3" />
              {anchor ? (
                <text x={atStart ? plot.left + 8 : right - 6} y={y(anchor.tvd) - 5} textAnchor={atStart ? 'start' : 'end'} className={TEXT} {...HALO}>
                  {horizon.name}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Reference plane */}
        {plane ? (
          <g data-slot="section-plane">
            <line x1={plot.left} x2={right} y1={y(plane.tvd)} y2={y(plane.tvd)} stroke="var(--kit-line-amber)" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={plot.left + plot.width / 2} y={y(plane.tvd) - 5} textAnchor="middle" className="fill-[var(--kit-line-amber)] text-xs font-semibold tabular-nums" {...HALO}>
              {plane.label}
            </text>
            {crossing ? <circle cx={x(crossing.departure)} cy={y(crossing.tvd)} r={5} fill="var(--kit-halo)" stroke="var(--kit-line-amber)" strokeWidth={2.5} /> : null}
          </g>
        ) : null}

        {/* The well */}
        <path data-slot="section-well" d={sectionPath(path, frame)} fill="none" stroke="var(--kit-text)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {marks.map((mark) => {
          const cx_ = x(mark.departure);
          const cy_ = y(mark.tvd);
          return (
            <g key={mark.id} data-kind={mark.kind}>
              {mark.kind === 'shoe' ? (
                <path d={`M${cx_ - 6} ${cy_} L${cx_ + 6} ${cy_} L${cx_} ${cy_ - 9} Z`} fill="var(--kit-text)" />
              ) : mark.kind === 'kickoff' ? (
                <circle cx={cx_} cy={cy_} r={4.5} fill="var(--kit-halo)" stroke="var(--kit-text)" strokeWidth={1.5} />
              ) : (
                <rect x={cx_ - 4.5} y={cy_ - 4.5} width={9} height={9} fill="var(--kit-text)" />
              )}
              {mark.kind === 'td' ? (
                // Total depth is named under the toe, towards whichever side has room.
                <text x={cx_ > plot.left + plot.width / 2 ? cx_ + 5 : cx_ - 5} y={cy_ + 20} textAnchor={cx_ > plot.left + plot.width / 2 ? 'end' : 'start'} className={cx(TEXT, 'font-semibold')} {...HALO}>
                  {mark.label}
                </text>
              ) : (
                <>
                  <line x1={cx_ + 8} x2={cx_ + 22} y1={cy_ - 4} y2={cy_ - 12} stroke="var(--kit-text)" strokeWidth={1} />
                  <text x={cx_ + 25} y={cy_ - 10} className={TEXT} {...HALO}>
                    {mark.label}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Key to the marks, under the departure axis */}
        <g data-slot="section-key" transform={`translate(${plot.left} ${bottom + 44})`}>
          {band && bandPath ? (
            <>
              <rect x={0} y={-10} width={16} height={12} fill="color-mix(in oklab, var(--kit-text) 9%, transparent)" stroke="var(--kit-rule-strong)" strokeWidth={1} />
              <text x={22} y={0} className={TEXT}>
                {band.label}
              </text>
            </>
          ) : null}
          <path d="M100 2 L112 2 L106 -8 Z" fill="var(--kit-text)" />
          <text x={118} y={0} className={TEXT}>
            Casing shoe
          </text>
          <rect x={206} y={-8} width={9} height={9} fill="var(--kit-text)" />
          <text x={221} y={0} className={TEXT}>
            Total depth
          </text>
        </g>

        {/* Dimension lines: departure reached along the top, depth reached down the right */}
        <g data-slot="section-dimensions" stroke="var(--kit-text)" strokeWidth={1}>
          <line x1={x(0)} x2={x(furthest.departure)} y1={plot.top - 16} y2={plot.top - 16} />
          <line x1={x(0)} x2={x(0)} y1={plot.top - 22} y2={plot.top - 4} />
          <line x1={x(furthest.departure)} x2={x(furthest.departure)} y1={plot.top - 22} y2={plot.top - 4} />
          <line x1={x(0) - 4} x2={x(0) + 4} y1={plot.top - 12} y2={plot.top - 20} />
          <line x1={x(furthest.departure) - 4} x2={x(furthest.departure) + 4} y1={plot.top - 12} y2={plot.top - 20} />
          <line x1={right + 14} x2={right + 14} y1={y(0)} y2={y(deepest.tvd)} />
          <line x1={right + 4} x2={right + 20} y1={y(deepest.tvd)} y2={y(deepest.tvd)} />
          <line x1={right + 10} x2={right + 18} y1={y(deepest.tvd) + 4} y2={y(deepest.tvd) - 4} />
          <line x1={right + 10} x2={right + 18} y1={y(0) + 4} y2={y(0) - 4} />
        </g>
        <text x={(x(0) + x(furthest.departure)) / 2} y={plot.top - 24} textAnchor="middle" className={cx(TEXT, 'font-semibold')}>
          Departure {formatNumber(furthest.departure)} m
        </text>
        <text transform={`translate(${right + 30} ${(y(0) + y(deepest.tvd)) / 2}) rotate(90)`} textAnchor="middle" className={cx(TEXT, 'font-semibold')}>
          TVD {formatNumber(deepest.tvd)} m
        </text>
      </svg>
    </div>
  );
}
