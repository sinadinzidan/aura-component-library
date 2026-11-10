import { cn } from '../../../lib/utils';
import { TONE_SURFACE } from '../status';
import { StatusDot } from '../StatusDot';
import { StatusIndicator } from '../StatusIndicator';

import { STATION_STATES, countStates, stationStatus } from './lines';
import type { StationState } from './lines';

export type LineStation = {
  id: string;
  /** Short station name or operation number: "OP 40". */
  name: string;
  state: StationState;
  /** What the station does, shown under the name when there is room: "Leak test". */
  operation?: string;
};

export type LineStatusStripProps = {
  /** The line, for the accessible name: "Line 3". */
  label: string;
  /** In flow order, first station first. */
  stations: readonly LineStation[];
  /** Count per state under the strip. */
  showSummary?: boolean;
  className?: string;
};

/**
 * A production line as one row of stations in flow order, each with its state in shape and words.
 * Running stations stay quiet; blocked, starved and down stations are tinted, so the eye goes to
 * where the flow is broken — and whether the cause sits upstream or downstream of it.
 */
export function LineStatusStrip({ label, stations, showSummary = true, className }: LineStatusStripProps) {
  const counts = countStates(stations.map((station) => station.state));
  const summary = STATION_STATES.filter((state) => counts[state] > 0);

  return (
    <div data-slot="line-status-strip" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <ol aria-label={`${label} stations in flow order`} className="grid grid-cols-[repeat(auto-fit,minmax(4.75rem,1fr))] gap-1">
        {stations.map((station) => {
          const status = stationStatus(station.state);
          return (
            <li
              key={station.id}
              data-slot="line-station"
              data-state={station.state}
              className={cn('flex min-w-0 flex-col gap-1.5 rounded-lg p-2', station.state === 'running' ? 'bg-muted-background text-base-foreground' : TONE_SURFACE[status.tone])}
            >
              <span className="font-mono text-xs">{station.name}</span>
              {station.operation ? <span className="text-xs opacity-80">{station.operation}</span> : null}
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <StatusDot size="sm" tone={status.tone} shape={status.shape} />
                {status.label}
              </span>
            </li>
          );
        })}
      </ol>
      {showSummary ? (
        <ul aria-label={`${label} stations by state`} className="flex flex-wrap gap-x-4 gap-y-1">
          {summary.map((state) => (
            <li key={state}>
              <StatusIndicator size="sm" {...stationStatus(state)} detail={String(counts[state])} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
