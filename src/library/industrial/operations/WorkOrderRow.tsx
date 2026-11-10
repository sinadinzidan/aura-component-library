import { IconShieldLock } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { PersonAvatar } from '../../display/PersonAvatar';
import { StatusBadge } from '../../display/StatusBadge';

import { DueLabel } from './DueLabel';
import { PriorityBadge } from './PriorityBadge';
import type { OperationsWorkOrder, WorkOrderPerson } from './workOrders';

export type WorkOrderRowProps = {
  order: Pick<OperationsWorkOrder, 'id' | 'title' | 'priority' | 'status'>;
  /** Tag of the equipment the work is on. */
  assetTag?: string;
  assetName?: string;
  /** Due date, already formatted. */
  due: string;
  overdue?: boolean;
  assignee?: WorkOrderPerson;
  /** A permit to work is needed before the job can start. */
  permitRequired?: boolean;
  /** `compact` drops the status badge and the assignee name for side panels. */
  density?: 'full' | 'compact';
  actions?: ReactNode;
  className?: string;
};

/**
 * One work order as a list row: priority, number and title, the equipment, status, due date and
 * assignee. Columns have fixed widths so stacked rows align like a table.
 */
export function WorkOrderRow({
  order,
  assetTag,
  assetName,
  due,
  overdue = false,
  assignee,
  permitRequired = false,
  density = 'full',
  actions,
  className,
}: WorkOrderRowProps) {
  const done = order.status === 'done';

  return (
    <li data-slot="work-order-row" data-status={order.status} className={cn('flex min-w-0 items-center gap-4 py-2.5', className)}>
      <span className="w-8 shrink-0">
        <PriorityBadge priority={order.priority} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className={cn('truncate text-sm', done ? 'text-muted-foreground' : 'text-base-foreground')}>{order.title}</p>
          {permitRequired ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-warning-foreground-strong">
              <IconShieldLock aria-hidden="true" className="size-3.5" />
              Permit
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{order.id}</span>
          {assetTag ? (
            <>
              {' · '}
              <span className="font-mono">{assetTag}</span>
            </>
          ) : null}
          {assetName ? ` ${assetName}` : null}
        </p>
      </div>

      {density === 'full' ? (
        <span className="w-28 shrink-0">
          <StatusBadge status={order.status} />
        </span>
      ) : null}

      <DueLabel due={due} overdue={overdue} done={done} className={density === 'full' ? 'w-32 shrink-0' : 'shrink-0'} />

      {density === 'full' ? (
        <span className="flex w-36 shrink-0 items-center gap-2">
          {assignee ? (
            <>
              <PersonAvatar name={assignee.name} initials={assignee.initials} colorKey={assignee.id} sizes="xsm" />
              <span className="truncate text-xs text-base-foreground">{assignee.name}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </span>
      ) : assignee ? (
        <PersonAvatar name={assignee.name} initials={assignee.initials} colorKey={assignee.id} sizes="xsm" />
      ) : null}

      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </li>
  );
}
