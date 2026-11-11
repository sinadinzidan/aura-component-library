import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { gasReadingTone, type GasLimits } from './permits';

type GasReadingProps = {
  /** Gas name, e.g. `Oxygen`. */
  gas: string;
  /** Formula or short name, e.g. `O₂`. */
  symbol: string;
  value: number;
  unit: string;
  decimals?: number;
  limits: GasLimits;
  /** End of the scale the bar is drawn on. */
  scaleMax: number;
  /** When and by whom the reading was taken. */
  taken?: string;
  className?: string;
};

const WORD = { success: 'Safe', warning: 'Near limit', critical: 'Unsafe' } as const;

/**
 * One gas-test reading: the gas, the figure, the safe window drawn on a scale with the reading
 * as a marker, and a word for the verdict. In the signal look the whole tile fills with the
 * verdict; elsewhere only the figure and the marker carry it.
 */
export function GasReading({ gas, symbol, value, unit, decimals = 1, limits, scaleMax, taken, className }: GasReadingProps) {
  const look = useLook();
  const tone = gasReadingTone(value, limits);
  const word = tone === 'success' || tone === 'warning' || tone === 'critical' ? WORD[tone] : 'Safe';
  const filled = look === 'signal' || look === 'poster';
  const share = (point: number): number => Math.min(100, Math.max(0, (point / scaleMax) * 100));
  const from = share(limits.low ?? 0);
  const to = share(limits.high ?? scaleMax);
  const window = limits.low !== undefined && limits.high !== undefined ? `${formatNumber(limits.low, decimals)}–${formatNumber(limits.high, decimals)}` : limits.high !== undefined ? `below ${formatNumber(limits.high, decimals)}` : `above ${formatNumber(limits.low ?? 0, decimals)}`;

  return (
    <div
      data-look={look}
      data-tone={tone}
      className={cx('flex min-w-0 flex-col gap-3 p-4', className)}
      style={{
        borderRadius: 'var(--kit-radius-sm)',
        background: filled ? 'var(--t-solid)' : 'var(--kit-well)',
        color: filled ? 'var(--t-on-solid)' : 'var(--kit-text)',
        boxShadow: filled ? undefined : 'inset 0 0 0 1px var(--kit-rule)',
      }}
    >
      <p className="text-sm font-semibold">
        {gas} <span className="font-medium opacity-70">{symbol}</span>
      </p>
      <div className="flex items-baseline justify-between gap-2">
        <p className="tabular-nums" style={{ fontSize: '1.75rem', lineHeight: 1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
          {formatNumber(value, decimals)}
          <span className="ml-1 text-sm font-medium tracking-normal opacity-70">{unit}</span>
        </p>
        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: filled ? undefined : 'var(--t-ink)' }}>
          {word}
        </span>
      </div>
      <div role="meter" aria-label={`${gas} reading`} aria-valuemin={0} aria-valuemax={scaleMax} aria-valuenow={value} aria-valuetext={`${formatNumber(value, decimals)} ${unit}, ${word.toLowerCase()}`} className="relative h-2" style={{ background: filled ? 'color-mix(in oklab, currentColor 25%, transparent)' : 'var(--kit-track)', borderRadius: 'var(--kit-track-radius)' }}>
        <span className="absolute inset-y-0" style={{ left: `${from}%`, width: `${to - from}%`, background: filled ? 'color-mix(in oklab, currentColor 55%, transparent)' : 'color-mix(in oklab, var(--kit-line-success) 55%, transparent)', borderRadius: 'var(--kit-track-radius)' }} />
        <span className="absolute -inset-y-1 w-1" style={{ left: `calc(${share(value)}% - 2px)`, background: filled ? 'currentColor' : 'var(--kit-text)', borderRadius: 2 }} />
      </div>
      <p className="text-xs opacity-80">
        Safe {window} {unit}
        {taken ? ` · ${taken}` : ''}
      </p>
    </div>
  );
}
