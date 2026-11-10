import { cn } from '../../../lib/utils';
import { LinearGauge } from '../LinearGauge';
import { LABEL_TEXT, formatValue } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { stationStatus } from './lines';
import type { StationState } from './lines';
import { TaktIndicator } from './TaktIndicator';

export type StationCardProps = {
  /** Operation number, printed in monospace: "OP 40". */
  code: string;
  /** What the station does: "Leak test". */
  name: string;
  state: StationState;
  /** Why it is in this state, or since when: "Waiting for OP 50 · 4 min". */
  detail?: string;
  /** Mean cycle time of the last parts, in seconds. */
  cycleTime: number;
  takt: number;
  /** Good parts so far this shift, and the plan for this point in the shift. */
  count: number;
  target: number;
  className?: string;
};

/**
 * One station on a line: state, cycle time against takt and parts made against plan. The two
 * questions a team leader asks at a station — is it keeping pace, and is it on count.
 */
export function StationCard({ code, name, state, detail, cycleTime, takt, count, target, className }: StationCardProps) {
  const status = stationStatus(state);
  const behind = target - count;

  return (
    <article
      data-slot="station-card"
      data-state={state}
      aria-label={`Station ${code}, ${name}: ${status.label.toLowerCase()}`}
      className={cn('flex w-full min-w-0 flex-col gap-4 rounded-xl border border-default bg-card-background p-4', className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-sm font-medium text-base-foreground">{code}</span>
          <span className={LABEL_TEXT}>{name}</span>
        </div>
        <StatusIndicator size="sm" {...status} />
      </header>
      {detail ? <p className="text-xs text-medium-foreground">{detail}</p> : null}
      <TaktIndicator cycleTime={cycleTime} takt={takt} />
      <div className="flex flex-col gap-1.5">
        <LinearGauge size="sm" label="Count" value={count} max={Math.max(target, count)} target={target} unit={`of ${formatValue(target, 0)}`} />
        <span data-slot="station-count-gap" className="text-xs tabular-nums text-muted-foreground">
          {behind > 0 ? `${formatValue(behind, 0)} behind plan` : behind < 0 ? `${formatValue(-behind, 0)} ahead of plan` : 'On plan'}
        </span>
      </div>
    </article>
  );
}
