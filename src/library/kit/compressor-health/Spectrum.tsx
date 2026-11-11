import { useId } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, niceTicks, type Tone } from '../tones';

export type SpectrumPeak = {
  /** Position on the frequency axis, in the axis unit. */
  frequency: number;
  /** What the peak is: "1×", "Blade pass". */
  label: string;
};

type SpectrumProps = {
  /** What the plot shows: "Velocity spectrum, drive-end bearing". */
  label: string;
  /** Amplitude per bin, evenly spaced from zero to `maxFrequency`. */
  bins: readonly number[];
  maxFrequency: number;
  /** Unit of the frequency axis. */
  frequencyUnit?: string;
  /** Unit of the amplitude. */
  unit?: string;
  /** Named peaks, marked above the trace. */
  peaks?: readonly SpectrumPeak[];
  /** An amplitude limit drawn across the plot. */
  limit?: { value: number; label: string };
  tone?: Tone;
  /** Plot height in px. */
  height?: number;
  className?: string;
};

/**
 * A vibration spectrum: amplitude over frequency as a filled trace, with the peaks that matter
 * named (running speed and its multiples) and the amplitude limit drawn across.
 */
export function Spectrum({ label, bins, maxFrequency, frequencyUnit = 'Hz', unit = 'mm/s', peaks = [], limit, tone = 'accent', height = 220, className }: SpectrumProps) {
  const look = useLook();
  const gradient = useId();
  const top = niceTicks(Math.max(...bins, limit?.value ?? 0) * 1.15, 3);
  const max = top[top.length - 1] || 1;
  const step = 1000 / Math.max(bins.length - 1, 1);
  const y = (value: number) => 100 - (Math.min(value, max) / max) * 100;
  const trace = bins.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)} ${y(value).toFixed(2)}`).join('');
  const amplitudeAt = (frequency: number) => bins[Math.round((frequency / maxFrequency) * (bins.length - 1))] ?? 0;
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((share) => share * maxFrequency);

  return (
    <figure data-look={look} data-tone={tone} className={cx('grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-(--kit-text)', className)}>
      <div aria-hidden="true" className="relative w-8" style={{ height }}>
        {top.map((tick) => (
          <span key={tick} className="absolute right-0 -translate-y-1/2 text-xs text-(--kit-text-3) tabular-nums" style={{ top: `${y(tick)}%` }}>
            {formatNumber(tick, max < 5 ? 1 : 0)}
          </span>
        ))}
      </div>
      <div role="img" aria-label={label} className="relative border-b border-l border-(--kit-rule)" style={{ height }}>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--t-line)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--t-line)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {top.slice(1).map((tick) => (
            <path key={tick} d={`M0 ${y(tick)}H1000`} stroke="var(--kit-rule)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${trace}L1000 100L0 100Z`} fill={`url(#${gradient})`} />
          <path d={trace} fill="none" stroke="var(--t-line)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px var(--t-line))' }} />
          {limit ? <path d={`M0 ${y(limit.value)}H1000`} stroke="var(--kit-line-critical)" strokeWidth="1.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        {limit ? (
          <span className="absolute right-1 -translate-y-full text-xs font-medium text-(--kit-line-critical) tabular-nums" style={{ top: `${y(limit.value)}%` }}>
            {limit.label} {formatNumber(limit.value, 1)} {unit}
          </span>
        ) : null}
        {peaks.map((peak) => {
          const amplitude = amplitudeAt(peak.frequency);
          return (
            <span
              key={peak.label}
              className="absolute -translate-x-1/2 -translate-y-full pb-1.5 text-center text-xs leading-4 whitespace-nowrap"
              style={{ left: `${(peak.frequency / maxFrequency) * 100}%`, top: `${y(amplitude)}%` }}
            >
              <span className="block font-semibold text-(--kit-text)">{peak.label}</span>
              <span className="block text-(--kit-text-2) tabular-nums">{formatNumber(amplitude, 1)}</span>
            </span>
          );
        })}
      </div>
      <div />
      <div aria-hidden="true" className="relative mt-1.5 h-5">
        {xTicks.map((tick, index) => (
          <span
            key={tick}
            className={cx('absolute text-xs whitespace-nowrap text-(--kit-text-3) tabular-nums', index === 0 ? '' : index === xTicks.length - 1 ? '-translate-x-full' : '-translate-x-1/2')}
            style={{ left: `${(tick / maxFrequency) * 100}%` }}
          >
            {formatNumber(tick)}
            {index === xTicks.length - 1 ? ` ${frequencyUnit}` : ''}
          </span>
        ))}
      </div>
    </figure>
  );
}
