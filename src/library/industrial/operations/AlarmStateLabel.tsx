import { IconBellRinging, IconBellZ, IconCheck, IconCircleCheck } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { alarmStateLabel } from './alarms';
import type { AlarmState } from './alarms';

export type AlarmStateLabelProps = {
  state: AlarmState;
  /** Quiet text after the state, such as who acknowledged or when the shelf ends. */
  detail?: string;
  className?: string;
};

const ICON: Record<AlarmState, typeof IconCheck> = {
  active: IconBellRinging,
  acknowledged: IconCheck,
  shelved: IconBellZ,
  cleared: IconCircleCheck,
};

/**
 * Where an alarm is in its life cycle, as icon and word. Deliberately colourless: severity owns
 * the colour of an alarm row, so the state is carried by weight — only "Unacknowledged" is strong.
 */
export function AlarmStateLabel({ state, detail, className }: AlarmStateLabelProps) {
  const Icon = ICON[state];

  return (
    <span
      data-slot="alarm-state"
      data-state={state}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-xs',
        state === 'active' ? 'font-medium text-base-foreground' : 'text-muted-foreground',
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{alarmStateLabel(state)}</span>
      {detail ? <span className="font-normal text-muted-foreground tabular-nums">{detail}</span> : null}
    </span>
  );
}
