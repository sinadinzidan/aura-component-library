import { useLook } from '../../looks/useLook';
import { FIGURE_STYLE } from '../process-flow/anatomy';
import { StatusPill } from '../StatusPill';
import { cx, formatNumber } from '../tones';

import { frequencyState } from './power';

type FrequencyBandProps = {
  /** What is measured: "Grid frequency at 82-EL-2200". */
  label: string;
  /** Hz. */
  value: number;
  nominal?: number;
  /** Deviation inside which the frequency is normal, Hz. */
  normalBand?: number;
  /** Deviation beyond which it is an alert, Hz. */
  alertBand?: number;
  /** Half-width of the scale, Hz. */
  span?: number;
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * Grid frequency on a scale centred on nominal, with the normal and alert bands drawn in and a
 * pointer at the reading. The state is a word next to the figure; the bands explain it.
 */
export function FrequencyBand({ label, value, nominal = 50, normalBand = 0.1, alertBand = 0.2, span = 0.5, size = 'md', className }: FrequencyBandProps) {
  const look = useLook();
  const state = frequencyState(value, nominal, normalBand, alertBand);
  const at = (hz: number) => Math.max(0, Math.min(100, ((hz - (nominal - span)) / (span * 2)) * 100));
  const flat = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';
  const outlined = look === 'blueprint';
  const zone = (from: number, to: number, tone: 'critical' | 'warning' | 'success', strength: number) => (
    <span
      data-tone={tone}
      className="absolute inset-y-0"
      style={{ left: `${at(from)}%`, width: `${at(to) - at(from)}%`, background: outlined ? 'transparent' : `color-mix(in oklab, var(--t-line) ${strength}%, transparent)`, boxShadow: outlined ? 'inset 0 0 0 1px var(--t-line)' : undefined }}
    />
  );
  const ticks = [nominal - span, nominal - alertBand, nominal - normalBand, nominal, nominal + normalBand, nominal + alertBand, nominal + span];

  return (
    <div data-look={look} data-tone={state.tone} className={cx('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="flex items-baseline gap-1.5 text-(--kit-text) tabular-nums">
          <span style={{ ...FIGURE_STYLE, fontSize: size === 'lg' ? '3rem' : '2.25rem' }}>{formatNumber(value, 2)}</span>
          <span className="text-sm font-medium text-(--kit-text-3)">Hz</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-(--kit-text-2) tabular-nums">
            {value >= nominal ? '+' : '−'}
            {formatNumber(Math.abs(value - nominal) * 1000, 0)} mHz
          </span>
          <StatusPill tone={state.tone}>{state.word}</StatusPill>
        </div>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={nominal - span} aria-valuemax={nominal + span} aria-valuenow={value} aria-valuetext={`${formatNumber(value, 2)} hertz, ${state.word.toLowerCase()}`} className="relative" style={{ height: size === 'lg' ? 28 : 20 }}>
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: flat ? 0 : 999, background: 'var(--kit-track)' }}>
          {zone(nominal - span, nominal - alertBand, 'critical', 55)}
          {zone(nominal - alertBand, nominal - normalBand, 'warning', 50)}
          {zone(nominal - normalBand, nominal + normalBand, 'success', 45)}
          {zone(nominal + normalBand, nominal + alertBand, 'warning', 50)}
          {zone(nominal + alertBand, nominal + span, 'critical', 55)}
        </div>
        <span aria-hidden="true" data-slot="frequency-pointer" className="absolute -top-1.5 -bottom-1.5 -translate-x-1/2" style={{ left: `${at(value)}%`, width: 4, borderRadius: flat ? 0 : 2, background: 'var(--kit-text)', boxShadow: '0 0 0 2px var(--kit-halo)' }} />
      </div>
      <div className="relative h-4 text-xs text-(--kit-text-3) tabular-nums">
        {ticks.map((tick, index) => (
          <span key={tick} className={cx('absolute whitespace-nowrap', index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2', tick === nominal && 'font-semibold text-(--kit-text-2)')} style={{ left: `${at(tick)}%` }}>
            {formatNumber(tick, 1)}
          </span>
        ))}
      </div>
    </div>
  );
}
