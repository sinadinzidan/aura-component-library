import type { CSSProperties } from 'react';

import { useLookDefinition } from '../looks/useLook';

import { Legend } from './Legend';
import { cx, formatNumber, type Tone } from './tones';

export type DonutSegment = { label: string; value: number; tone: Tone };

type DonutProps = {
  /** What the whole is, for example "Open work orders by type". */
  label: string;
  segments: readonly DonutSegment[];
  /** Figure in the middle. Defaults to the total. */
  centerValue?: string;
  /** Word under the figure: "open", "units". */
  centerCaption?: string;
  /** Diameter in px. */
  size?: number;
  legend?: 'right' | 'bottom' | 'none';
  decimals?: number;
  unit?: string;
  className?: string;
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Parts of a whole, with the total in the middle and a legend that carries the numbers. */
export function Donut({ label, segments, centerValue, centerCaption, size = 148, legend = 'right', decimals = 0, unit = '', className }: DonutProps) {
  const { id: look, chart } = useLookDefinition();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const stroke = RADIUS * chart.ring * 1.15;
  const rounded = look === 'studio' || look === 'soft' || look === 'glass';
  // Round caps extend past the dash, so the gap grows with the stroke.
  const gap = segments.length > 1 ? (rounded ? stroke + 2.5 : look === 'poster' ? 0 : 1.6) : 0;
  const style: CSSProperties & Record<'--kit-donut-size', string> = { '--kit-donut-size': `${size}px` };

  let offset = 0;
  const arcs = segments.map((segment) => {
    const length = (segment.value / total) * CIRCUMFERENCE;
    const arc = { segment, dash: Math.max(length - gap, 0.5), start: offset + gap / 2 };
    offset += length;
    return arc;
  });

  return (
    <div data-look={look} data-legend={legend} style={style} className={cx('kit-donut', className)}>
      <div role="img" aria-label={label} className="kit-donut-dial">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {arcs.map(({ segment, dash, start }) => (
            <circle
              key={segment.label}
              data-tone={segment.tone}
              className="kit-donut-seg"
              cx="50"
              cy="50"
              r={RADIUS}
              strokeWidth={stroke}
              strokeDasharray={`${dash.toFixed(2)} ${(CIRCUMFERENCE - dash).toFixed(2)}`}
              strokeDashoffset={(-start).toFixed(2)}
            />
          ))}
        </svg>
        <div className="kit-donut-center">
          <span className="kit-donut-figure">{centerValue ?? formatNumber(total, decimals)}</span>
          {centerCaption ? <span className="kit-donut-caption">{centerCaption}</span> : null}
        </div>
      </div>
      {legend === 'none' ? null : (
        <Legend
          direction="column"
          items={segments.map((segment) => ({
            label: segment.label,
            tone: segment.tone,
            value: `${formatNumber(segment.value, decimals)}${unit}`,
          }))}
        />
      )}
    </div>
  );
}
