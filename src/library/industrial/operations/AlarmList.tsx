import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { AlarmRow } from './AlarmRow';
import { sortAlarmsBySeverity } from './alarms';
import type { OperationsAlarm } from './alarms';

export type AlarmListProps<T extends OperationsAlarm> = {
  alarms: readonly T[];
  /** Accessible name of the list, for example "Active alarms". */
  label: string;
  /** Formats `raisedAt` for the age column. */
  formatAge: (raisedAt: number) => string;
  getAssetName?: (alarm: T) => string | undefined;
  density?: 'full' | 'compact';
  /** `severity` (default) puts the most severe first; `none` keeps the order given. */
  sort?: 'severity' | 'none';
  /** Id of the alarm that came first in a trip sequence. */
  firstOutId?: string;
  /** Re-trigger counts by alarm id, for chattering markers. */
  repeatCounts?: Readonly<Record<string, number>>;
  renderActions?: (alarm: T) => ReactNode;
  /** Shown instead of the list when there are no alarms. */
  empty?: ReactNode;
  className?: string;
};

/**
 * Alarm rows in the order an operator works them: most severe first, newest first within a
 * severity. Rows are separated by one hairline; the list itself has no outer border.
 */
export function AlarmList<T extends OperationsAlarm>({
  alarms,
  label,
  formatAge,
  getAssetName,
  density = 'full',
  sort = 'severity',
  firstOutId,
  repeatCounts,
  renderActions,
  empty = 'No alarms',
  className,
}: AlarmListProps<T>) {
  if (alarms.length === 0) {
    return (
      <div data-slot="alarm-list-empty" className={cn('w-full py-6 text-center text-sm text-muted-foreground', className)}>
        {empty}
      </div>
    );
  }

  const ordered = sort === 'severity' ? sortAlarmsBySeverity(alarms) : alarms;

  return (
    <ul data-slot="alarm-list" aria-label={label} className={cn('flex w-full min-w-0 flex-col divide-y divide-default', className)}>
      {ordered.map((alarm) => (
        <AlarmRow
          key={alarm.id}
          alarm={alarm}
          age={formatAge(alarm.raisedAt)}
          assetName={getAssetName?.(alarm)}
          density={density}
          firstOut={alarm.id === firstOutId}
          repeatCount={repeatCounts?.[alarm.id]}
          actions={renderActions?.(alarm)}
        />
      ))}
    </ul>
  );
}
