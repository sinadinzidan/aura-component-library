import { Badge } from '@cognite/aura/components/badge';
import { IconFlag, IconRepeat } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { TONE_VALUE_TEXT, severityStatus } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import type { OperationsAlarm } from './alarms';
import { AlarmStateLabel } from './AlarmStateLabel';

export type AlarmRowProps = {
  alarm: OperationsAlarm;
  /** How long ago it was raised, already formatted: "14 min ago". */
  age: string;
  /** Equipment the tag belongs to. */
  assetName?: string;
  /** `full` adds the value-against-limit and state columns; `compact` fits side panels and cards. */
  density?: 'full' | 'compact';
  /** Times the alarm re-triggered inside `repeatWindow`. Shown as a chattering marker from 2 up. */
  repeatCount?: number;
  repeatWindow?: string;
  /** Marks the alarm that came first in a trip sequence. */
  firstOut?: boolean;
  /** Quiet text after the state, such as "until 18:00" for a shelved alarm. */
  stateDetail?: string;
  /** Row actions: acknowledge, shelve, open. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One alarm as a list row: severity (dot shape, colour and word), message, tag, value against
 * limit, state and age. Columns have fixed widths so a list of rows reads as a table. Only an
 * unacknowledged critical alarm pulses; a cleared alarm drops to muted text.
 */
export function AlarmRow({
  alarm,
  age,
  assetName,
  density = 'full',
  repeatCount,
  repeatWindow = '10 min',
  firstOut = false,
  stateDetail,
  actions,
  className,
}: AlarmRowProps) {
  const severity = severityStatus(alarm.severity);
  const isOpen = alarm.state === 'active' || alarm.state === 'acknowledged';
  const isCleared = alarm.state === 'cleared';
  const isChattering = repeatCount !== undefined && repeatCount > 1;

  return (
    <li
      data-slot="alarm-row"
      data-severity={alarm.severity}
      data-state={alarm.state}
      className={cn('flex min-w-0 items-center gap-4 py-2.5', className)}
    >
      <span className="w-20 shrink-0">
        <StatusIndicator size="sm" {...severity} pulse={alarm.state === 'active' && alarm.severity === 'critical'} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className={cn('truncate text-sm', isCleared ? 'text-muted-foreground' : 'text-base-foreground')}>{alarm.message}</p>
          {firstOut ? (
            <Badge variant="secondary">
              <IconFlag aria-hidden="true" />
              First out
            </Badge>
          ) : null}
          {isChattering ? (
            <Badge variant="warning" aria-label={`Chattering: ${repeatCount} times in ${repeatWindow}`}>
              <IconRepeat aria-hidden="true" />
              {repeatCount}× in {repeatWindow}
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{alarm.sensorTag}</span>
          {assetName ? ` · ${assetName}` : null}
          {density === 'compact' ? ` · ${alarm.value}` : null}
        </p>
      </div>

      {density === 'full' ? (
        <div className="flex w-24 shrink-0 flex-col items-end gap-0.5">
          <span className={cn('text-sm font-medium tabular-nums', isOpen ? TONE_VALUE_TEXT[severity.tone === 'info' ? 'neutral' : severity.tone] : 'text-muted-foreground')}>
            {alarm.value}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">Limit {alarm.limit}</span>
        </div>
      ) : null}

      {density === 'full' ? <AlarmStateLabel state={alarm.state} detail={stateDetail} className="w-36 shrink-0" /> : null}

      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{age}</span>

      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </li>
  );
}
