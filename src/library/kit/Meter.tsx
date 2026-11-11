import { useLook } from '../looks/useLook';

import { cx, formatNumber, type Tone } from './tones';

type MeterProps = {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  decimals?: number;
  /** A marker on the track, with its name: `{ value: 97.5, label: 'Target' }`. */
  target?: { value: number; label: string };
  /** Start of the high-limit zone: everything above is shaded as out of range. */
  high?: number;
  /** End of the low-limit zone: everything below is shaded as out of range. */
  low?: number;
  tone?: Tone;
  /** Hide the min, target and max captions under the bar. */
  hideScale?: boolean;
  className?: string;
};

/**
 * A value on its range as a bar, with the target and the limit zones drawn on the same track so
 * "how far from where it should be" is readable without the numbers.
 */
export function Meter({ label, value, min = 0, max, unit, decimals = 0, target, high, low, tone = 'accent', hideScale = false, className }: MeterProps) {
  const look = useLook();
  const span = max - min || 1;
  const position = (point: number) => `${Math.min(100, Math.max(0, ((point - min) / span) * 100))}%`;
  const text = `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}`;

  return (
    <div data-look={look} data-tone={tone} className={cx('kit-meter', className)}>
      <div className="kit-meter-head">
        <span className="kit-meter-label">{label}</span>
        <span className="kit-meter-value">
          {formatNumber(value, decimals)}
          {unit ? <span className="kit-meter-unit">{unit}</span> : null}
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={text} className="kit-meter-track">
        {low !== undefined ? <span className="kit-meter-zone" style={{ left: 0, width: position(low) }} /> : null}
        {high !== undefined ? <span className="kit-meter-zone" style={{ left: position(high), right: 0 }} /> : null}
        <span className="kit-meter-fill" style={{ width: position(value) }} />
        {target ? <span className="kit-meter-target" style={{ left: position(target.value) }} /> : null}
      </div>
      {hideScale ? null : (
        <div className="kit-meter-scale">
          <span>{formatNumber(min, decimals)}</span>
          {target ? (
            <span>
              {target.label} {formatNumber(target.value, decimals)}
            </span>
          ) : null}
          <span>{formatNumber(max, decimals)}</span>
        </div>
      )}
    </div>
  );
}
