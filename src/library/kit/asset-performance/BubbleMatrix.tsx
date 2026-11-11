import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

export type MatrixPoint = {
  id: string;
  /** Written beside the bubble: a tag or a short name. */
  label: string;
  /** Read out with the label: the full name. */
  name?: string;
  x: number;
  y: number;
  /** Drives the bubble area. */
  size: number;
  tone: Tone;
};

export type MatrixAxis = {
  label: string;
  min: number;
  max: number;
  ticks: readonly number[];
  /** Named ranges along the axis, such as criticality classes. */
  bands?: readonly { from: number; to: number; label: string }[];
};

export type MatrixQuadrant = {
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  title: string;
  /** What to do with assets that land here. */
  note: string;
  tone?: Tone;
};

type BubbleMatrixProps = {
  /** What the chart shows: "Criticality against condition for 11 units". */
  label: string;
  points: readonly MatrixPoint[];
  xAxis: MatrixAxis;
  yAxis: MatrixAxis;
  /** Where the quadrant lines cross, in axis values. */
  split: { x: number; y: number };
  quadrants?: readonly MatrixQuadrant[];
  /** What bubble area means, with its unit: "Downtime, h". */
  sizeLabel: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Plot height in px. */
  height?: number;
  /** Smallest and largest bubble diameter in px. */
  diameters?: readonly [number, number];
  className?: string;
};

const CORNER: Record<MatrixQuadrant['corner'], string> = {
  'top-left': 'top-2 left-3 text-left',
  'top-right': 'top-2 right-3 text-right',
  'bottom-left': 'bottom-2 left-3 text-left',
  'bottom-right': 'bottom-2 right-3 text-right',
};

function share(value: number, axis: MatrixAxis): number {
  return ((value - axis.min) / (axis.max - axis.min)) * 100;
}

/**
 * A bubble chart cut into four quadrants: two scores place each asset, a third sets its area.
 * Quadrants carry the instruction ("Act now"), and the selected bubble drops dimension lines to
 * both axes so its two scores can be read exactly.
 */
export function BubbleMatrix({
  label,
  points,
  xAxis,
  yAxis,
  split,
  quadrants = [],
  sizeLabel,
  selectedId,
  onSelect,
  height = 480,
  diameters = [18, 64],
  className,
}: BubbleMatrixProps) {
  const look = useLook();
  const largest = Math.max(1, ...points.map((point) => point.size));
  const selected = points.find((point) => point.id === selectedId);
  const diameter = (size: number) => diameters[0] + Math.sqrt(Math.max(size, 0) / largest) * (diameters[1] - diameters[0]);
  // Large bubbles are drawn first so small ones stay clickable on top.
  const ordered = [...points].sort((a, b) => b.size - a.size);
  const splitX = share(split.x, xAxis);
  const splitY = 100 - share(split.y, yAxis);

  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col gap-2 text-sm text-(--kit-text)', className)}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="relative w-24" style={{ height }} aria-hidden="true">
          <span className="absolute top-1/2 left-0 origin-center -translate-x-[calc(50%-10px)] -translate-y-1/2 -rotate-90 text-xs font-medium whitespace-nowrap text-(--kit-text-2)">
            {yAxis.label}
          </span>
          {yAxis.ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2 text-xs text-(--kit-text-2) tabular-nums" style={{ top: `${100 - share(tick, yAxis)}%` }}>
              {formatNumber(tick)}
            </span>
          ))}
          {(yAxis.bands ?? []).map((band) => (
            <span key={band.label} className="absolute right-0 -translate-y-1/2 text-sm font-semibold whitespace-nowrap" style={{ top: `${100 - share((band.from + band.to) / 2, yAxis)}%` }}>
              {band.label}
            </span>
          ))}
        </div>

        <div role="group" aria-label={label} className="relative border border-(--kit-rule-strong)" style={{ height }}>
          {yAxis.ticks.map((tick) => (
            <div key={`y${tick}`} aria-hidden="true" className="absolute inset-x-0 border-t border-(--kit-rule)" style={{ top: `${100 - share(tick, yAxis)}%` }} />
          ))}
          {xAxis.ticks.map((tick) => (
            <div key={`x${tick}`} aria-hidden="true" className="absolute inset-y-0 border-l border-(--kit-rule)" style={{ left: `${share(tick, xAxis)}%` }} />
          ))}
          <div aria-hidden="true" className="absolute inset-y-0 border-l-2 border-dashed border-(--kit-rule-strong)" style={{ left: `${splitX}%` }} />
          <div aria-hidden="true" className="absolute inset-x-0 border-t-2 border-dashed border-(--kit-rule-strong)" style={{ top: `${splitY}%` }} />

          {quadrants.map((quadrant) => (
            <div key={quadrant.corner} data-tone={quadrant.tone ?? 'neutral'} className={cx('absolute max-w-[46%]', CORNER[quadrant.corner])}>
              <p className={cx('text-base font-semibold', quadrant.tone ? 'text-(--t-ink)' : 'text-(--kit-text)')}>{quadrant.title}</p>
              {quadrant.note ? <p className="text-xs text-(--kit-text-2)">{quadrant.note}</p> : null}
            </div>
          ))}

          {selected ? (
            <div data-tone={selected.tone} aria-hidden="true">
              <div
                className="absolute border-l border-(--t-line)"
                style={{ left: `${share(selected.x, xAxis)}%`, top: `${100 - share(selected.y, yAxis)}%`, bottom: 0 }}
              />
              <div
                className="absolute border-t border-(--t-line)"
                style={{ top: `${100 - share(selected.y, yAxis)}%`, left: 0, width: `${share(selected.x, xAxis)}%` }}
              />
              <span
                className="absolute bottom-0 z-10 -translate-x-1/2 translate-y-[calc(100%+3px)] bg-(--t-solid) px-1.5 py-0.5 text-xs font-semibold text-(--t-on-solid) tabular-nums"
                style={{ left: `${share(selected.x, xAxis)}%` }}
              >
                {formatNumber(selected.x)}
              </span>
              <span
                className="absolute left-0 z-10 -translate-x-[calc(100%+3px)] -translate-y-1/2 bg-(--t-solid) px-1.5 py-0.5 text-xs font-semibold text-(--t-on-solid) tabular-nums"
                style={{ top: `${100 - share(selected.y, yAxis)}%` }}
              >
                {formatNumber(selected.y)}
              </span>
            </div>
          ) : null}

          {ordered.map((point) => {
            const left = share(point.x, xAxis);
            const size = diameter(point.size);
            const active = point.id === selectedId;
            const flip = left > 88;
            const position: CSSProperties = { left: `${left}%`, top: `${100 - share(point.y, yAxis)}%` };
            return (
              <div key={point.id} data-tone={point.tone} className="absolute" style={position}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`${point.name ?? point.label}, ${xAxis.label.toLowerCase()} ${formatNumber(point.x)}, ${yAxis.label.toLowerCase()} ${formatNumber(point.y)}, ${sizeLabel.toLowerCase()} ${formatNumber(point.size)}`}
                  onClick={() => onSelect?.(point.id)}
                  className={cx(
                    'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-(--t-line) outline-none',
                    'focus-visible:ring-2 focus-visible:ring-(--kit-text) focus-visible:ring-offset-2',
                    active && 'ring-2 ring-(--t-line) ring-offset-2 ring-offset-(--kit-halo)'
                  )}
                  style={{
                    width: size,
                    height: size,
                    background: active ? 'var(--t-line)' : 'color-mix(in oklab, var(--t-line) 20%, transparent)',
                  }}
                />
                <span
                  aria-hidden="true"
                  className={cx(
                    'pointer-events-none absolute -translate-y-1/2 bg-(--kit-halo) px-1 text-xs whitespace-nowrap tabular-nums',
                    active ? 'font-semibold text-(--kit-text)' : 'font-medium text-(--kit-text-2)'
                  )}
                  style={flip ? { right: size / 2 + 5 } : { left: size / 2 + 5 }}
                >
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>

        <div />
        <div className="relative mt-1 h-6" aria-hidden="true">
          {xAxis.ticks.map((tick) => (
            <span key={tick} className="absolute -translate-x-1/2 text-xs text-(--kit-text-2) tabular-nums" style={{ left: `${share(tick, xAxis)}%` }}>
              {formatNumber(tick)}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pl-27 text-xs text-(--kit-text-2)">
        <span className="font-medium">{xAxis.label}</span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full border border-(--kit-rule-strong)" />
          <span aria-hidden="true" className="inline-block size-5 rounded-full border border-(--kit-rule-strong)" />
          Bubble area: {sizeLabel}
        </span>
      </figcaption>
    </figure>
  );
}
