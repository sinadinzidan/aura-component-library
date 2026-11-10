import { IconArrowDown, IconArrowUp, IconMinus } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { clamp } from '../geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, TONE_TEXT, formatValue } from '../status';
import type { Tone } from '../status';
import { ValueReadout } from '../ValueReadout';

import { batteryRuntime, formatHours } from './power';
import type { BatteryMode } from './power';

export type StateOfChargeProps = {
  /** The battery, e.g. "Battery storage BESS-01". */
  label: string;
  /** State of charge in percent. */
  charge: number;
  /** Usable capacity in MWh. */
  capacity: number;
  /** Power in MW: positive while charging, negative while discharging. */
  power: number;
  /** Charge the operator keeps back, in percent. Discharge time counts down to it. */
  reserve?: number;
  className?: string;
};

const MODE: Record<BatteryMode, { label: string; ends: string; Icon: typeof IconArrowUp; tone: Tone }> = {
  charging: { label: 'Charging', ends: 'Full in', Icon: IconArrowUp, tone: 'info' },
  discharging: { label: 'Discharging', ends: 'Reserve in', Icon: IconArrowDown, tone: 'neutral' },
  idle: { label: 'Idle', ends: '', Icon: IconMinus, tone: 'neutral' },
};

/**
 * A battery's state of charge with what it is doing: charging or discharging, at what power, and
 * how long until it is full or down to its reserve. The bar turns warning at the reserve — below
 * it the battery can no longer deliver what it is held for.
 */
export function StateOfCharge({ label, charge, capacity, power, reserve = 0, className }: StateOfChargeProps) {
  const level = clamp(charge, 0, 100);
  const runtime = batteryRuntime(level, capacity, power, { reservePercent: reserve });
  const mode = MODE[runtime.mode];
  const tone: Tone = reserve > 0 && level <= reserve ? 'warning' : 'neutral';
  const stored = (level / 100) * capacity;
  const timeText = runtime.hours === null ? null : `${mode.ends} ${formatHours(runtime.hours)}`;
  const name = `${label}: ${formatValue(level, 0)} % charged, ${mode.label.toLowerCase()}${runtime.mode === 'idle' ? '' : ` at ${formatValue(Math.abs(power), 1)} MW`}${
    tone === 'warning' ? ', at or below reserve' : ''
  }`;

  return (
    <div data-slot="state-of-charge" data-mode={runtime.mode} data-tone={tone} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
        <span data-slot="charge-mode" className={cn('inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium', TONE_TEXT[mode.tone])}>
          <mode.Icon aria-hidden className="size-3.5" />
          {mode.label}
          {runtime.mode === 'idle' ? null : <span className="tabular-nums">{formatValue(Math.abs(power), 1)} MW</span>}
        </span>
      </div>

      <ValueReadout size="lg" value={level} unit="%" tone={tone} />

      <div role="img" aria-label={name} className="flex items-center gap-0.5">
        <div className="relative h-6 flex-1 rounded-md border border-emphasized p-0.5">
          <div data-slot="charge-fill" className={cn('h-full rounded-sm', TONE_MARK_BG[tone])} style={{ width: `${level}%` }} />
          {reserve > 0 ? <span data-slot="charge-reserve" className="absolute inset-y-0 w-px bg-base-foreground" style={{ left: `${clamp(reserve, 0, 100)}%` }} /> : null}
        </div>
        <span className="h-2.5 w-1 rounded-r-sm bg-chart-neutral-300" />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={SCALE_TEXT}>
          {formatValue(stored, 1)} of {formatValue(capacity, 0)} MWh{reserve > 0 ? ` · reserve ${formatValue(reserve, 0)} %` : ''}
        </span>
        {tone === 'warning' ? (
          <span className="text-xs font-medium text-warning-foreground-strong">At reserve</span>
        ) : timeText ? (
          <span className="text-xs tabular-nums text-base-foreground">{timeText}</span>
        ) : null}
      </div>
    </div>
  );
}
