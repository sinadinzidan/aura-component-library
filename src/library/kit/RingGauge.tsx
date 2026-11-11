import type { CSSProperties } from 'react';

import { useLookDefinition } from '../looks/useLook';

import { cx, formatNumber, type Tone } from './tones';

type RingGaugeProps = {
  /** What is measured; shown under the ring and used as the accessible name. */
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  tone?: Tone;
  /** Diameter in px, or `fill` to take the width of the container and scale the figure with it. */
  size?: number | 'fill';
  /** Keep the label for assistive technology only, when a heading next to the ring already says it. */
  hideLabel?: boolean;
  className?: string;
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A share of a whole as a ring with the figure in the middle. Thickness and line ends follow the look. */
export function RingGauge({ label, value, min = 0, max = 100, unit = '%', decimals = 0, tone = 'accent', size = 112, hideLabel = false, className }: RingGaugeProps) {
  const { id: look, chart } = useLookDefinition();
  const share = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const stroke = RADIUS * chart.ring;
  const fill = size === 'fill';
  const style: (CSSProperties & Record<'--kit-ring-size', string>) | undefined = fill ? undefined : { '--kit-ring-size': `${size}px` };

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${formatNumber(value, decimals)} ${unit}`.trim()}
      data-look={look}
      data-tone={tone}
      data-fill={fill ? 'true' : undefined}
      style={style}
      className={cx('kit-ring', className)}
    >
      <div className="kit-ring-dial">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="kit-ring-track" cx="50" cy="50" r={RADIUS} strokeWidth={stroke} />
          <circle
            className="kit-ring-value"
            cx="50"
            cy="50"
            r={RADIUS}
            strokeWidth={stroke}
            strokeDasharray={`${(share * CIRCUMFERENCE).toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`}
          />
        </svg>
        <div className="kit-ring-center">
          <span className="kit-ring-figure">{formatNumber(value, decimals)}</span>
          {unit ? <span className="kit-ring-unit">{unit}</span> : null}
        </div>
      </div>
      {hideLabel ? null : <span className="kit-ring-label">{label}</span>}
    </div>
  );
}
