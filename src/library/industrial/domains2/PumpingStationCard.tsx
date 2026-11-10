import { cn } from '../../../lib/utils';
import { LABEL_TEXT, formatValue, runStateStatus } from '../status';
import type { RunState } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

export type StationPump = {
  id: string;
  /** Pump tag, printed in monospace. */
  tag: string;
  /** What the pump is assigned to do in the current rotation. */
  duty: 'duty' | 'assist' | 'standby';
  state: RunState;
  /** Speed in percent of full speed, for variable-speed pumps. */
  speed?: number;
};

export type StationReading = { label: string; value: number | null; unit: string; decimals?: number };

export type PumpingStationCardProps = {
  name: string;
  /** Station tag or number, printed in monospace. */
  tag?: string;
  pumps: readonly StationPump[];
  /** The station's headline readings, usually flow and delivery pressure. Two or three fit. */
  readings: readonly StationReading[];
  className?: string;
};

const DUTY_LABEL: Record<StationPump['duty'], string> = { duty: 'Duty', assist: 'Assist', standby: 'Standby' };

/**
 * A pumping station as an operator thinks of it: how many pumps are running, which is on duty and
 * which stands by, and what the station delivers. A duty pump that is not running is the thing to
 * notice, so its state carries the colour; a standby pump at rest stays quiet.
 */
export function PumpingStationCard({ name, tag, pumps, readings, className }: PumpingStationCardProps) {
  const running = pumps.filter((pump) => pump.state === 'running').length;

  return (
    <article
      data-slot="pumping-station-card"
      aria-label={`${name}: ${running} of ${pumps.length} pumps running`}
      className={cn('flex w-full min-w-0 flex-col gap-4 rounded-xl border border-default bg-card-background p-4', className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-base-foreground">{name}</span>
          {tag ? <span className="font-mono text-xs text-muted-foreground">{tag}</span> : null}
        </div>
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {running} of {pumps.length} running
        </span>
      </header>

      <dl className="flex flex-wrap gap-x-6 gap-y-3">
        {readings.map((reading) => (
          <div key={reading.label} className="flex flex-col gap-1.5">
            <dt className={LABEL_TEXT}>{reading.label}</dt>
            <dd>
              <ValueReadout size="sm" value={reading.value} unit={reading.unit} decimals={reading.decimals ?? 0} />
            </dd>
          </div>
        ))}
      </dl>

      <ul aria-label="Pumps" className="flex flex-col">
        {pumps.map((pump) => (
          <li key={pump.id} data-slot="station-pump" className="flex items-center gap-3 border-t border-default py-2 text-xs last:pb-0">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="whitespace-nowrap font-mono text-base-foreground">{pump.tag}</span>
              <span className="text-muted-foreground">{DUTY_LABEL[pump.duty]}</span>
            </span>
            <span className="ml-auto whitespace-nowrap tabular-nums text-muted-foreground">{pump.speed === undefined || pump.state !== 'running' ? '' : `${formatValue(pump.speed, 0)} %`}</span>
            <StatusIndicator size="sm" {...runStateStatus(pump.state)} className="w-24" />
          </li>
        ))}
      </ul>
    </article>
  );
}
