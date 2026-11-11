import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { rangeShare } from './limits';

type BlockGaugeProps = {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  decimals?: number;
  /** Blocks above this value are drawn in the warning colour. */
  high?: number;
  /** Blocks above this value are drawn in the critical colour. */
  trip?: number;
  /** Colour of the blocks inside the limits. */
  tone?: Tone;
  /** Number of blocks the range is cut into: 24 lying, 16 standing unless set. */
  segments?: number;
  /** `vertical` stands the gauge up as a ladder, for a row of many tags. */
  orientation?: 'horizontal' | 'vertical';
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * A value as lit blocks on a segmented scale, the way a panel bargraph shows it. Each block
 * carries the colour of its zone, so the lit end changes colour as the value passes a limit.
 */
export function BlockGauge({ label, value, min = 0, max, unit, decimals = 0, high, trip, tone = 'accent', segments: segmentCount, orientation = 'horizontal', size = 'md', className }: BlockGaugeProps) {
  const look = useLook();
  const segments = segmentCount ?? (orientation === 'vertical' ? 16 : 24);
  const lit = Math.round(rangeShare(value, min, max) * segments);
  const step = (max - min) / segments;
  const zoneOf = (index: number): Tone => {
    const top = min + (index + 1) * step;
    if (trip !== undefined && top > trip) return 'critical';
    if (high !== undefined && top > high) return 'warning';
    return tone;
  };
  const current: Tone = lit > 0 ? zoneOf(lit - 1) : tone;
  const vertical = orientation === 'vertical';
  const outlined = look === 'poster';
  const blocks = Array.from({ length: segments }, (_, index) => (
    <span
      key={index}
      data-tone={zoneOf(index)}
      data-lit={index < lit}
      className="min-h-0 min-w-0 flex-1"
      style={{
        background: index < lit ? 'var(--t-line)' : 'color-mix(in oklab, var(--t-line) 20%, var(--kit-track))',
        borderRadius: 'min(var(--kit-track-radius), 3px)',
        boxShadow: outlined && index < lit ? 'inset 0 0 0 1.5px var(--kit-text)' : undefined,
      }}
    />
  ));
  const figure = (
    <span className="tabular-nums text-(--kit-text)" style={{ fontSize: size === 'lg' ? '1.75rem' : '1.125rem', lineHeight: 1.1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
      {formatNumber(value, decimals)}
      {unit ? <span className="ml-1 text-xs font-medium tracking-normal text-(--kit-text-3)">{unit}</span> : null}
    </span>
  );
  const meter = {
    role: 'meter',
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': value,
    'aria-valuetext': `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}`,
  } as const;

  if (vertical) {
    return (
      <div data-look={look} data-tone={current} data-orientation="vertical" className={cx('flex min-w-0 flex-col items-center gap-2', className)}>
        {figure}
        <div {...meter} className="flex w-10 flex-col-reverse gap-[3px]" style={{ height: size === 'lg' ? 200 : 140 }}>
          {blocks}
        </div>
        <span className="flex min-h-8 items-start text-center text-xs font-medium text-(--kit-text-2)">{label}</span>
      </div>
    );
  }

  return (
    <div data-look={look} data-tone={current} data-orientation="horizontal" className={cx('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-(--kit-text-2)">{label}</span>
        {figure}
      </div>
      <div {...meter} className="flex gap-[3px]" style={{ height: size === 'lg' ? 28 : 18 }}>
        {blocks}
      </div>
      <div className="flex justify-between text-xs text-(--kit-text-3) tabular-nums">
        <span>{formatNumber(min, 0)}</span>
        {high !== undefined ? <span>High {formatNumber(high, decimals)}</span> : null}
        <span>{formatNumber(max, 0)}</span>
      </div>
    </div>
  );
}
