import type { LookId } from '../../looks/looks';
import { useLookDefinition } from '../../looks/useLook';
import { areaPath, extent, linePath, runs, share, type Point } from '../time-series/plotMath';
import { cx, type Tone } from '../tones';

import { extremes } from './sparkMath';

export type MicroTrendVariant = 'line' | 'area' | 'bars' | 'step' | 'dots';

const LOOK_VARIANT: Record<LookId, MicroTrendVariant> = {
  studio: 'area',
  console: 'line',
  poster: 'bars',
  glass: 'area',
  editorial: 'line',
  soft: 'area',
  blueprint: 'line',
  signal: 'bars',
};

type MicroTrendProps = {
  /** Recent values, oldest first. `null` is a gap. */
  values: ReadonlyArray<number | null>;
  /** What the trend shows, for example "Discharge pressure, last 24 hours". */
  label: string;
  tone?: Tone;
  /** Leave out to let the look choose. */
  variant?: MicroTrendVariant;
  /** A limit drawn as a dashed line; bars and dots at or above it take `overTone`. */
  limit?: number;
  overTone?: Tone;
  /** The normal range, shaded behind the trend. */
  band?: readonly [number, number];
  /** A fixed value range, so several trends can share one scale. Otherwise it fits the data. */
  domain?: readonly [number, number];
  /** `last` marks the latest value, `extremes` the lowest and highest. */
  marker?: 'last' | 'extremes' | 'none';
  /** Draw in the surrounding text colour, for trends on a filled tile or inside a sentence. */
  ink?: boolean;
  /** Layout classes: a size such as `h-8 w-28`. */
  className?: string;
};

const W = 100;
const H = 32;
const PAD = 3;

/**
 * A word-sized trend that can carry what a sensor reading needs: a limit, a normal band, gaps and
 * marked extremes. The look chooses its form and weight; pass `variant` to fix one.
 */
export function MicroTrend({ values, label, tone = 'accent', variant, limit, overTone = 'critical', band, domain, marker = 'last', ink = false, className }: MicroTrendProps) {
  const { id: look, chart } = useLookDefinition();
  const kind = variant ?? LOOK_VARIANT[look];
  const present = values.some((value) => value !== null);
  const [low, high] = domain ?? extent([values, limit === undefined ? [] : [limit], band ? [...band] : []]);
  const flat = high === low;
  const x = (index: number): number => (values.length <= 1 ? W / 2 : (index / (values.length - 1)) * W);
  const y = (value: number): number => (flat ? H / 2 : H - PAD - share(value, low, high) * (H - PAD * 2));
  const color = ink ? 'currentColor' : 'var(--t-line)';
  const stroke = Math.max(1.25, chart.strokeWidth * 0.8);
  const curve = kind === 'step' ? 'stepAfter' : chart.curve === 'stepAfter' ? 'linear' : chart.curve;
  const segments = runs(values, (value, index): Point => ({ x: x(index), y: y(value) }));
  const slot = W / Math.max(values.length, 1);
  const ends = extremes(values);
  const lastIndex = values.reduce<number>((found, value, index) => (value === null ? found : index), -1);
  const marks = !present || kind === 'bars' || kind === 'dots' || marker === 'none' ? [] : marker === 'extremes' && ends ? [ends.min, ends.max] : lastIndex >= 0 ? [lastIndex] : [];

  return (
    <span
      role="img"
      aria-label={present ? label : `${label}: no data`}
      data-look={look}
      data-tone={tone}
      data-variant={kind}
      data-empty={!present}
      className={cx('relative inline-block shrink-0 align-middle', className ?? 'h-8 w-28')}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        {band && present ? <rect data-part="band" x={0} width={W} y={y(Math.max(...band))} height={Math.abs(y(band[0]) - y(band[1]))} style={{ fill: color, opacity: 0.14 }} /> : null}
        {!present ? <line data-part="empty" x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="var(--kit-text-3)" strokeWidth={1.5} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" /> : null}
        {present && kind === 'bars'
          ? values.map((value, index) => {
              if (value === null) return null;
              const top = Math.min(y(value), H - 2);
              const over = limit !== undefined && value >= limit;
              return (
                <rect
                  key={index}
                  data-part="bar"
                  data-tone={over ? overTone : undefined}
                  data-over={over}
                  x={index * slot + slot * 0.14}
                  width={slot * 0.72}
                  y={top}
                  height={H - top}
                  style={{ fill: ink && !over ? 'currentColor' : 'var(--t-line)', opacity: index === lastIndex || over ? 1 : 0.62 }}
                />
              );
            })
          : null}
        {present && kind === 'dots'
          ? values.map((value, index) => {
              if (value === null) return null;
              const over = limit !== undefined && value >= limit;
              return (
                <path
                  key={index}
                  data-part="dot"
                  data-tone={over ? overTone : undefined}
                  data-over={over}
                  d={`M${(index + 0.5) * slot} ${y(value)}h0`}
                  strokeWidth={stroke + 2.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: ink && !over ? 'currentColor' : 'var(--t-line)' }}
                />
              );
            })
          : null}
        {present && kind === 'area' ? segments.map((points, index) => <path key={index} data-part="area" d={areaPath(points, curve, H)} style={{ fill: color, opacity: 0.18 }} />) : null}
        {present && kind !== 'bars' && kind !== 'dots'
          ? segments.map((points, index) => (
              <path
                key={index}
                data-part="line"
                d={points.length === 1 ? `M${points[0].x} ${points[0].y}h0` : linePath(points, curve)}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: color, filter: look === 'glass' && !ink ? 'drop-shadow(0 0 4px var(--t-line))' : undefined }}
              />
            ))
          : null}
        {present && chart.points && kind === 'line' && values.length <= 32
          ? segments.flat().map((point) => <path key={point.x} data-part="point" d={`M${point.x} ${point.y}h0`} strokeWidth={stroke + 2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ stroke: color }} />)
          : null}
        {limit !== undefined && present ? (
          <line data-part="limit" data-tone={overTone} x1={0} x2={W} y1={y(limit)} y2={y(limit)} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" style={{ stroke: 'var(--t-line)' }} />
        ) : null}
      </svg>
      {marks.map((index) => {
        const value = values[index];
        if (value === null || value === undefined) return null;
        return (
          <span
            key={index}
            aria-hidden="true"
            data-part="marker"
            className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${(x(index) / W) * 100}%`, top: `${(y(value) / H) * 100}%`, background: color, boxShadow: ink ? undefined : '0 0 0 2px var(--kit-halo)' }}
          />
        );
      })}
    </span>
  );
}
