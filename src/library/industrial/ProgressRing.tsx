import { cn } from '../../lib/utils';

import { ringDash, toFraction } from './geometry';
import { LABEL_TEXT, TONE_MARK_STROKE, describeReading } from './status';
import type { Tone } from './status';
import type { ValueReadoutSize } from './ValueReadout';
import { ValueReadout } from './ValueReadout';

export type ProgressRingSize = 'sm' | 'md' | 'lg';

export type ProgressRingProps = {
  label: string;
  value: number | null;
  /** The value that closes the ring. */
  max?: number;
  unit?: string;
  decimals?: number;
  size?: ProgressRingSize;
  /** Neutral is the data colour. Set a status tone only when the share itself is a state. */
  tone?: Tone;
  /** Number inside the ring (`md`, `lg`) or beside it (`sm`). */
  showValue?: boolean;
  /** Label under the ring (`md`, `lg`) or beside it (`sm`). */
  showLabel?: boolean;
  className?: string;
};

const DIMENSIONS: Record<ProgressRingSize, { size: number; stroke: number; readout: ValueReadoutSize }> = {
  sm: { size: 20, stroke: 3, readout: 'xs' },
  md: { size: 64, stroke: 6, readout: 'sm' },
  lg: { size: 96, stroke: 8, readout: 'md' },
};

/**
 * A closed ring for a share of a whole: availability, completion, health score. For a value with
 * limits on an open scale use `RadialGauge` instead.
 */
export function ProgressRing({
  label,
  value,
  max = 100,
  unit = '%',
  decimals = 0,
  size = 'md',
  tone = 'neutral',
  showValue = true,
  showLabel = false,
  className,
}: ProgressRingProps) {
  const dimensions = DIMENSIONS[size];
  const center = dimensions.size / 2;
  const radius = center - dimensions.stroke / 2;
  const hasValue = value !== null && Number.isFinite(value);
  const fraction = hasValue ? toFraction(value, 0, max) : 0;
  const inline = size === 'sm';

  const ring = (
    <svg
      role="img"
      aria-label={describeReading(label, value, unit, decimals, tone)}
      width={dimensions.size}
      height={dimensions.size}
      viewBox={`0 0 ${dimensions.size} ${dimensions.size}`}
      fill="none"
      className="block shrink-0"
    >
      <circle data-slot="ring-track" cx={center} cy={center} r={radius} strokeWidth={dimensions.stroke} className="stroke-chart-neutral-100" />
      {fraction > 0 ? (
        <circle
          data-slot="ring-value"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={dimensions.stroke}
          strokeLinecap={fraction < 1 ? 'round' : 'butt'}
          strokeDasharray={ringDash(radius, fraction)}
          transform={`rotate(-90 ${center} ${center})`}
          className={TONE_MARK_STROKE[tone]}
        />
      ) : null}
    </svg>
  );

  const readout = showValue ? (
    <ValueReadout value={hasValue ? value : null} unit={unit} decimals={decimals} size={dimensions.readout} tone={tone} />
  ) : null;

  if (inline) {
    return (
      <span data-slot="progress-ring" data-tone={tone} className={cn('inline-flex items-center gap-2', className)}>
        {ring}
        {readout}
        {showLabel ? <span className={LABEL_TEXT}>{label}</span> : null}
      </span>
    );
  }

  return (
    <div data-slot="progress-ring" data-tone={tone} className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: dimensions.size, height: dimensions.size }}>
        {ring}
        <div className="absolute inset-0 flex items-center justify-center">{readout}</div>
      </div>
      {showLabel ? <span className={cn(LABEL_TEXT, 'text-center')}>{label}</span> : null}
    </div>
  );
}
