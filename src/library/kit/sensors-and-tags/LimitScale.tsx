import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { judgeValue, rangeShare, type TagLimits } from './tags';

type LimitScaleProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  decimals?: number;
  limits: TagLimits;
  /** A setpoint drawn as a hollow marker on the scale. */
  setpoint?: number;
  /** Hide the tick labels under the scale, for a compact row. */
  bare?: boolean;
  /** Show the value in a flag above the marker. */
  flag?: boolean;
  className?: string;
};

/**
 * A reading on its instrument range with the limit zones drawn in: low, normal window, high and
 * trip. The marker takes the colour of the zone it stands in and the ticks name each limit.
 * Outline looks (blueprint, editorial) draw the zones as hatched outlines with dimension ticks;
 * the others draw solid bands.
 */
export function LimitScale({ label, value, min, max, unit, decimals = 1, limits, setpoint, bare = false, flag = false, className }: LimitScaleProps) {
  const look = useLook();
  const outline = look === 'blueprint' || look === 'editorial';
  const judgement = judgeValue(value, limits);
  const at = (point: number): number => rangeShare(point, min, max) * 100;
  const zones: Array<{ id: string; from: number; to: number; tone: 'warning' | 'critical' | 'success' }> = [];
  const normalFrom = limits.low ?? min;
  const normalTo = limits.high ?? max;
  if (limits.low !== undefined && limits.low > min) zones.push({ id: 'low', from: min, to: limits.low, tone: 'warning' });
  zones.push({ id: 'normal', from: normalFrom, to: normalTo, tone: 'success' });
  if (limits.high !== undefined) zones.push({ id: 'high', from: limits.high, to: limits.highHigh ?? max, tone: 'warning' });
  if (limits.highHigh !== undefined) zones.push({ id: 'trip', from: limits.highHigh, to: max, tone: 'critical' });
  const ticks: Array<{ id: string; at: number; text: string }> = [
    { id: 'min', at: min, text: formatNumber(min, 0) },
    ...(limits.low !== undefined && limits.low > min ? [{ id: 'low', at: limits.low, text: `L ${formatNumber(limits.low, decimals)}` }] : []),
    ...(limits.high !== undefined ? [{ id: 'high', at: limits.high, text: `H ${formatNumber(limits.high, decimals)}` }] : []),
    ...(limits.highHigh !== undefined ? [{ id: 'trip', at: limits.highHigh, text: `HH ${formatNumber(limits.highHigh, decimals)}` }] : []),
    { id: 'max', at: max, text: formatNumber(max, 0) },
  ];
  const text = `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}`;

  return (
    <div data-look={look} data-tone={judgement.tone} className={cx('flex min-w-0 flex-col', className)} style={{ paddingTop: flag ? 26 : 0 }}>
      <div role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${text}, ${judgement.word.toLowerCase()}`} className="relative h-3">
        <div className="absolute inset-0 flex overflow-hidden" style={{ borderRadius: 'var(--kit-track-radius)', background: 'var(--kit-track)', boxShadow: outline ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined }}>
          {zones.map((zone) => (
            <span
              key={zone.id}
              data-zone={zone.id}
              data-tone={zone.tone}
              className="absolute inset-y-0"
              style={{
                left: `${at(zone.from)}%`,
                width: `${at(zone.to) - at(zone.from)}%`,
                background: outline
                  ? zone.id === 'normal'
                    ? 'transparent'
                    : 'repeating-linear-gradient(135deg, var(--t-line) 0 1.5px, transparent 1.5px 5px)'
                  : `color-mix(in oklab, var(--t-line) ${zone.id === 'normal' ? 30 : 60}%, transparent)`,
                borderLeft: zone.id === 'normal' || zone.from === min ? undefined : '1.5px solid var(--kit-surface)',
              }}
            />
          ))}
        </div>
        {setpoint !== undefined ? <span data-setpoint aria-hidden className="absolute -top-1 size-5 -translate-x-1/2 rotate-45 scale-50" style={{ left: `${at(setpoint)}%`, boxShadow: 'inset 0 0 0 3px var(--kit-text)', background: 'var(--kit-surface)' }} /> : null}
        <span aria-hidden className="absolute -inset-y-1.5 w-1 -translate-x-1/2" style={{ left: `${at(value)}%`, background: 'var(--kit-text)', borderRadius: 2, boxShadow: '0 0 0 2px var(--kit-surface)' }} />
        {flag ? (
          <span aria-hidden className="absolute bottom-full mb-2.5 -translate-x-1/2 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums" style={{ left: `clamp(2rem, ${at(value)}%, calc(100% - 2rem))`, background: 'var(--t-solid)', color: 'var(--t-on-solid)', borderRadius: 'min(var(--kit-radius-sm), 6px)' }}>
            {text}
          </span>
        ) : null}
      </div>
      {bare ? null : (
        <div aria-hidden className="relative mt-2 h-4 text-xs text-(--kit-text-3) tabular-nums">
          {ticks.map((tick, index) => (
            <span key={tick.id} className={cx('absolute top-0 whitespace-nowrap', index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2', tick.id === 'min' || tick.id === 'max' ? '' : 'font-medium text-(--kit-text-2)')} style={{ left: `${at(tick.at)}%` }}>
              {tick.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
