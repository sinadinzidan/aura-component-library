import { useLook } from '../../looks/useLook';
import { BLOCK_ANATOMY, FIGURE_STYLE } from '../process-flow/anatomy';
import { cx, formatNumber, type Tone } from '../tones';

import { batteryRuntime, formatHours } from './power';

type BatteryGaugeProps = {
  /** Which battery: "Battery storage 82-BT-0001". */
  label: string;
  /** State of charge, 0–100. */
  charge: number;
  capacityMwh: number;
  /** Positive charges, negative discharges, MW. */
  powerMw: number;
  /** Charge kept back for black start or frequency response, per cent. */
  reservePercent?: number;
  size?: 'md' | 'lg';
  className?: string;
};

const SEGMENTS = 10;

/**
 * State of charge of a battery, with the reserve marked on the body, what it is doing in a word
 * and how long it can keep doing it. The fill turns to warning at the reserve. The body is a
 * rounded cell in the card looks and a row of blocks in console, poster, signal and blueprint.
 */
export function BatteryGauge({ label, charge, capacityMwh, powerMw, reservePercent = 20, size = 'md', className }: BatteryGaugeProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const blocks = anatomy === 'strip' || anatomy === 'solid' || anatomy === 'outline';
  const runtime = batteryRuntime(charge, capacityMwh, powerMw, { reservePercent });
  const atReserve = charge <= reservePercent;
  const tone: Tone = atReserve ? 'warning' : runtime.mode === 'charging' ? 'info' : 'success';
  const bodyHeight = size === 'lg' ? 72 : 52;
  const radius = blocks ? 'var(--kit-radius-sm)' : size === 'lg' ? 16 : 12;
  const word = runtime.mode === 'idle' ? 'Idle' : runtime.mode === 'charging' ? `Charging at ${formatNumber(powerMw, 1)} MW` : `Discharging at ${formatNumber(-powerMw, 1)} MW`;
  const remaining = runtime.hours === null ? 'Holding charge' : runtime.mode === 'charging' ? `Full in ${formatHours(runtime.hours)}` : atReserve ? 'At reserve' : `${formatHours(runtime.hours)} to reserve`;

  return (
    <div data-look={look} data-tone={tone} data-mode={runtime.mode} className={cx('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <p className="flex items-baseline gap-1.5 text-(--kit-text) tabular-nums">
          <span style={{ ...FIGURE_STYLE, fontSize: size === 'lg' ? '3rem' : '2.25rem' }}>{formatNumber(charge, 0)}</span>
          <span className="text-sm font-medium text-(--kit-text-3)">% · {formatNumber((charge / 100) * capacityMwh, 1)} MWh</span>
        </p>
        <div className="flex flex-col items-end text-right">
          <span className="text-sm font-semibold" style={{ color: 'var(--t-ink)' }}>
            {word}
          </span>
          <span className="text-xs text-(--kit-text-3) tabular-nums">{remaining}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={charge} aria-valuetext={`${formatNumber(charge, 0)} per cent, ${word.toLowerCase()}`} className="relative min-w-0 flex-1" style={{ height: bodyHeight }}>
          {blocks ? (
            <div className="flex h-full gap-1" style={{ padding: look === 'blueprint' ? 4 : 0, boxShadow: look === 'blueprint' ? 'inset 0 0 0 1.5px var(--kit-rule-strong)' : undefined }}>
              {Array.from({ length: SEGMENTS }, (_, index) => (
                <span key={index} data-lit={charge >= (index + 0.5) * (100 / SEGMENTS)} className="flex-1" style={{ background: charge >= (index + 0.5) * (100 / SEGMENTS) ? 'var(--t-line)' : 'color-mix(in oklab, var(--t-line) 16%, var(--kit-track))', boxShadow: look === 'poster' ? 'inset 0 0 0 2px var(--kit-text)' : undefined }} />
              ))}
            </div>
          ) : (
            <div className="h-full overflow-hidden" style={{ borderRadius: radius, background: 'var(--kit-track)', boxShadow: 'inset 0 0 0 1.5px var(--kit-rule-strong)', padding: 4 }}>
              <div data-slot="battery-fill" className="h-full" style={{ width: `${Math.max(0, Math.min(100, charge))}%`, borderRadius: `calc(${typeof radius === 'number' ? `${radius}px` : radius} - 4px)`, background: 'linear-gradient(90deg, color-mix(in oklab, var(--t-line) 70%, transparent), var(--t-line))' }} />
            </div>
          )}
          <span aria-hidden="true" data-slot="battery-reserve" className="absolute -top-1 -bottom-1" style={{ left: `${reservePercent}%`, width: 2, background: 'var(--kit-text)' }} />
        </div>
        <span aria-hidden="true" style={{ width: 6, height: bodyHeight * 0.42, borderRadius: blocks ? 0 : '0 4px 4px 0', background: 'var(--kit-rule-strong)' }} />
      </div>
      <div className="relative h-4 text-xs text-(--kit-text-3) tabular-nums" style={{ marginRight: 10 }}>
        <span className="absolute left-0">0</span>
        <span className="absolute -translate-x-1/2 font-medium whitespace-nowrap text-(--kit-text-2)" style={{ left: `${reservePercent}%` }}>
          Reserve {reservePercent} %
        </span>
        <span className="absolute right-0">100 %</span>
      </div>
    </div>
  );
}
