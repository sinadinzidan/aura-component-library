import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import type { LegendItem } from '../Legend';
import { toneLine, type Tone } from '../tones';

import { pointStyle } from './marks';
import { PlotFrame, type PlotAxis } from './PlotFrame';
import { percent } from './stats';

export type ScatterPoint = {
  x: number;
  y: number;
  /** Id of the group the point belongs to. */
  group?: string;
  /** Diameter in px, for a bubble chart. */
  size?: number;
  /** Written next to the point. Keep it short: a tag or a name. */
  label?: string;
};

export type ScatterGroup = { id: string; label: string; tone: Tone };

type ScatterPlotProps = {
  /** What the plot shows, in words. */
  label: string;
  points: readonly ScatterPoint[];
  /** Groups for the legend and the colour of each point. */
  groups?: readonly ScatterGroup[];
  x: PlotAxis;
  y: PlotAxis;
  /** A shaded rectangle, for example the normal operating envelope. */
  envelope?: { x: readonly [number, number]; y: readonly [number, number]; label: string; tone?: Tone };
  /** A reference curve, for example the design curve. */
  curve?: { points: readonly { x: number; y: number }[]; label: string; tone?: Tone };
  /** One point called out with a ring and a label: the current operating point. */
  highlight?: { x: number; y: number; label: string; tone?: Tone };
  /** Diameter in px of points without their own size. */
  pointSize?: number;
  height?: number;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * One quantity against another, a point per observation. An envelope, a design curve and a
 * highlighted current point turn the cloud into an answer: is it where it should be.
 */
export function ScatterPlot({ label, points, groups = [], x, y, envelope, curve, highlight, pointSize = 8, height = 300, headline, notes, className }: ScatterPlotProps) {
  const look = useLook();
  const toneOf = (group?: string): Tone => groups.find((entry) => entry.id === group)?.tone ?? 'accent';
  const legend: LegendItem[] = groups.map((group) => ({ label: group.label, tone: group.tone }));
  if (curve) legend.push({ label: curve.label, tone: curve.tone ?? 'neutral', mark: 'dashed' });
  if (envelope) legend.push({ label: envelope.label, tone: envelope.tone ?? 'success' });
  const curvePath = curve
    ? curve.points.map((point) => `${percent(point.x, x.min, x.max).replace('%', '')},${(100 - Number(percent(point.y, y.min, y.max).replace('%', ''))).toFixed(2)}`).join(' ')
    : '';

  return (
    <PlotFrame label={label} x={x} y={y} height={height} legend={legend.length > 0 ? legend : undefined} headline={headline} notes={notes} className={className}>
      {envelope ? (
        <span
          data-envelope=""
          className="absolute"
          style={{
            left: percent(envelope.x[0], x.min, x.max),
            right: `calc(100% - ${percent(envelope.x[1], x.min, x.max)})`,
            bottom: percent(envelope.y[0], y.min, y.max),
            top: `calc(100% - ${percent(envelope.y[1], y.min, y.max)})`,
            background: `color-mix(in oklab, ${toneLine(envelope.tone ?? 'success')} 14%, transparent)`,
            border: `1px dashed ${toneLine(envelope.tone ?? 'success')}`,
          }}
        />
      ) : null}
      {curve ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          <polyline
            data-curve=""
            points={curvePath}
            fill="none"
            stroke={toneLine(curve.tone ?? 'neutral')}
            strokeWidth={look === 'poster' ? 3 : 1.75}
            strokeDasharray={look === 'poster' ? undefined : '6 4'}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
      {points.map((point, index) => {
        const size = point.size ?? pointSize;
        return (
          <span
            key={index}
            data-point={point.group ?? ''}
            className="absolute -translate-x-1/2 translate-y-1/2"
            style={{ ...pointStyle(look, toneLine(toneOf(point.group))), left: percent(point.x, x.min, x.max), bottom: percent(point.y, y.min, y.max), width: size, height: size }}
          >
            {point.label ? (
              <span className="absolute left-full top-1/2 ml-1.5 -translate-y-1/2 whitespace-nowrap text-xs font-medium leading-4 text-[var(--kit-text)]">{point.label}</span>
            ) : null}
          </span>
        );
      })}
      {highlight ? (
        <span data-highlight="" className="absolute" style={{ left: percent(highlight.x, x.min, x.max), bottom: percent(highlight.y, y.min, y.max) }}>
          <span
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--kit-halo)]"
            style={{ borderColor: toneLine(highlight.tone ?? 'accent'), borderRadius: look === 'poster' || look === 'console' ? 0 : undefined }}
          />
          <span
            className="absolute bottom-3.5 right-0 translate-x-1/2 whitespace-nowrap px-2 text-xs font-semibold leading-6"
            style={{ background: toneLine(highlight.tone ?? 'accent'), color: 'var(--kit-halo)', borderRadius: 'var(--kit-radius-sm)' }}
          >
            {highlight.label}
          </span>
        </span>
      ) : null}
    </PlotFrame>
  );
}
