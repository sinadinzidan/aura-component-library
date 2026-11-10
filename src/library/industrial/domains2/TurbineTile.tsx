import { cn } from '../../../lib/utils';
import { LinearGauge } from '../LinearGauge';
import { LABEL_TEXT, TONE_SURFACE, formatValue } from '../status';
import { StatusDot } from '../StatusDot';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { turbineStatus } from './power';
import type { TurbineState } from './power';

export type TurbineTileProps = {
  /** Turbine name or position, e.g. "WTG-07". Printed in monospace. */
  name: string;
  state: TurbineState;
  /** Active power in MW. `null` when the turbine reports nothing. */
  power: number | null;
  /** Rated power in MW. */
  ratedPower: number;
  /** Wind speed at the nacelle in m/s. */
  windSpeed?: number | null;
  /** Rotor speed in rpm. */
  rotorSpeed?: number | null;
  /** Why it is not generating, or since when: "Gearbox oil temperature", "since 11:20". */
  detail?: string;
  /** `tile` is a full card; `cell` is the small square used in a farm grid. */
  variant?: 'tile' | 'cell';
  className?: string;
};

/**
 * One wind turbine: state in words, power against its rating and the wind it is working with.
 * Generating is the quiet state; a turbine that is curtailed, stopped or faulted takes its status
 * colour, and says why.
 */
export function TurbineTile({ name, state, power, ratedPower, windSpeed, rotorSpeed, detail, variant = 'tile', className }: TurbineTileProps) {
  const status = turbineStatus(state);
  const quiet = state === 'generating';
  const accessibleName = `Turbine ${name}: ${status.label.toLowerCase()}${power === null ? '' : `, ${formatValue(power, 1)} of ${formatValue(ratedPower, 1)} MW`}`;

  if (variant === 'cell') {
    return (
      <div
        data-slot="turbine-tile"
        data-state={state}
        role="img"
        aria-label={accessibleName}
        className={cn('flex min-w-0 flex-col gap-1.5 rounded-lg p-2', quiet ? 'bg-muted-background text-base-foreground' : TONE_SURFACE[status.tone], className)}
      >
        <span className="flex items-center justify-between gap-1.5">
          <span className="font-mono text-xs">{name}</span>
          <StatusDot size="sm" tone={status.tone} shape={status.shape} />
        </span>
        <span className="text-sm font-medium tabular-nums leading-none">{quiet ? formatValue(power, 1) : status.label.split(',')[0]}</span>
      </div>
    );
  }

  return (
    <article
      data-slot="turbine-tile"
      data-state={state}
      aria-label={accessibleName}
      className={cn('flex w-full min-w-0 flex-col gap-3 rounded-xl border border-default bg-card-background p-4', className)}
    >
      <header className="flex items-start justify-between gap-3">
        <span className="font-mono text-sm font-medium text-base-foreground">{name}</span>
        <StatusIndicator size="sm" {...status} />
      </header>
      <ValueReadout size="md" value={power} unit="MW" decimals={1} />
      <LinearGauge showHeader={false} size="sm" label={`${name} power against rated power`} value={power} max={ratedPower} unit="MW" decimals={1} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Rated</dt>
          <dd className="whitespace-nowrap tabular-nums text-base-foreground">{formatValue(ratedPower, 1)} MW</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Wind speed</dt>
          <dd className="whitespace-nowrap tabular-nums text-base-foreground">{formatValue(windSpeed, 1)} m/s</dd>
        </div>
        {rotorSpeed === undefined ? null : (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Rotor speed</dt>
            <dd className="whitespace-nowrap tabular-nums text-base-foreground">{formatValue(rotorSpeed, 1)} rpm</dd>
          </div>
        )}
      </dl>
      {detail ? <p className={LABEL_TEXT}>{detail}</p> : null}
    </article>
  );
}
