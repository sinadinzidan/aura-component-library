import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { rangeShare, roundTickCount } from './limits';

type BandScaleProps = {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  decimals?: number;
  /** The operating band the value should stay inside. */
  low: number;
  high: number;
  /** Trip limit above the band; everything beyond it is marked. */
  trip?: number;
  /** Colour of the pointer: the state of the value. */
  tone?: Tone;
  /** Number of labelled ticks under the scale. Leave out for round steps. */
  ticks?: number;
  /** Only the scale, without the label and value line above it: for table cells. */
  compact?: boolean;
  className?: string;
};

/**
 * A value as a pointer on a ruled scale with its operating band marked. On a blueprint and in
 * editorial the band is drawn as a dimension line with its bounds written out; elsewhere it is a
 * highlighted stretch of the track.
 */
export function BandScale({ label, value, min = 0, max, unit, decimals = 0, low, high, trip, tone = 'success', ticks: tickCount, compact = false, className }: BandScaleProps) {
  const look = useLook();
  const dimension = look === 'blueprint' || look === 'editorial';
  const at = (point: number) => `${rangeShare(point, min, max) * 100}%`;
  const ticks = tickCount ?? roundTickCount(max - min);
  const tickValues = Array.from({ length: ticks }, (_, index) => min + ((max - min) * index) / (ticks - 1));
  const text = `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}`;

  return (
    <div data-look={look} data-tone={tone} data-anatomy={dimension ? 'dimension' : 'track'} className={cx('flex min-w-0 flex-col', className)}>
      {compact ? null : (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-(--kit-text-2)">{label}</span>
          <span className="tabular-nums text-(--kit-text)" style={{ fontSize: '1.125rem', lineHeight: 1.2, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
            {formatNumber(value, decimals)}
            {unit ? <span className="ml-1 text-xs font-medium tracking-normal text-(--kit-text-3)">{unit}</span> : null}
          </span>
        </div>
      )}
      <div role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${text}, band ${formatNumber(low, decimals)} to ${formatNumber(high, decimals)}`} className="relative h-7">
        {dimension ? (
          <span className="absolute inset-x-0 top-4 border-t border-(--kit-text)" />
        ) : (
          <span className="absolute inset-x-0 top-3 bg-(--kit-track)" style={{ height: 8, borderRadius: 'var(--kit-track-radius)' }} />
        )}
        {dimension ? null : (
          <span
            data-tone="success"
            className="absolute top-3"
            style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})`, height: 8, background: 'color-mix(in oklab, var(--t-line) 42%, transparent)' }}
          />
        )}
        {trip !== undefined ? (
          <span
            data-tone="critical"
            className="absolute top-3"
            style={
              dimension
                ? { left: at(trip), right: 0, top: 14, height: 5, background: 'repeating-linear-gradient(135deg, var(--t-line) 0 2px, transparent 2px 5px)' }
                : { left: at(trip), right: 0, height: 8, background: 'color-mix(in oklab, var(--t-line) 55%, transparent)', borderRadius: '0 var(--kit-track-radius) var(--kit-track-radius) 0' }
            }
          />
        ) : null}
        {dimension
          ? tickValues.map((tick) => <span key={tick} className="absolute top-3 h-2.5 border-l border-(--kit-text)" style={{ left: at(tick) }} />)
          : null}
        <span className="absolute top-0 -translate-x-1/2" style={{ left: at(value) }}>
          <svg width="14" height="26" viewBox="0 0 14 26" aria-hidden="true" className="block">
            <path d="M1 1H13L7 10Z" fill="var(--t-line)" stroke="var(--kit-halo)" strokeWidth="1" />
            <path d="M7 10V25" stroke="var(--t-line)" strokeWidth="2" />
          </svg>
        </span>
      </div>
      {dimension ? (
        <div className="relative mt-1 h-5">
          <span className="absolute top-2 border-t border-(--kit-text-2)" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />
          <span className="absolute top-0.5 h-3 border-l border-(--kit-text-2)" style={{ left: at(low) }} />
          <span className="absolute top-0.5 h-3 border-l border-(--kit-text-2)" style={{ left: at(high) }} />
          <span
            className="absolute -top-0.5 -translate-x-1/2 bg-(--kit-halo) px-1.5 text-xs font-medium whitespace-nowrap text-(--kit-text-2) tabular-nums"
            style={{ left: `calc((${at(low)} + ${at(high)}) / 2)` }}
          >
            {formatNumber(low, decimals)}–{formatNumber(high, decimals)}
          </span>
        </div>
      ) : null}
      {compact ? null : (
        <div className="relative mt-1 h-4 text-xs text-(--kit-text-3) tabular-nums">
          {tickValues.map((tick, index) => (
            <span
              key={tick}
              className={cx('absolute top-0', index === 0 ? '' : index === ticks - 1 ? '-translate-x-full' : '-translate-x-1/2')}
              style={{ left: at(tick) }}
            >
              {formatNumber(tick, tick % 1 === 0 ? 0 : 1)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
