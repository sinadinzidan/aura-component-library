import { Card } from '@cognite/aura/components/card';
import { Progress } from '@cognite/aura/components/progress';
import { IconShieldLock } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { PersonAvatar } from '../../display/PersonAvatar';
import { StatusBadge } from '../../display/StatusBadge';

import { DueLabel } from './DueLabel';
import { PriorityBadge } from './PriorityBadge';
import { workOrderTypeLabel } from './workOrders';
import type { OperationsWorkOrder, WorkOrderPerson } from './workOrders';

export type WorkOrderCardProps = {
  order: Pick<OperationsWorkOrder, 'id' | 'title' | 'priority' | 'status' | 'type' | 'progress'>;
  assetTag?: string;
  assetName?: string;
  /** Due date, already formatted. */
  due: string;
  overdue?: boolean;
  assignee?: WorkOrderPerson;
  permitRequired?: boolean;
  /** Hide on a board whose column already names the status. */
  showStatus?: boolean;
  /** Progress bar for work that has started. */
  showProgress?: boolean;
  /** Why the work is held, for waiting orders: "Waiting for spare parts". */
  blockedBy?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * A work order as a card, for boards and "my work" lists: number and priority on top, the job,
 * the equipment, then due date and assignee. The same parts as `WorkOrderRow`, stacked.
 */
export function WorkOrderCard({
  order,
  assetTag,
  assetName,
  due,
  overdue = false,
  assignee,
  permitRequired = false,
  showStatus = true,
  showProgress = true,
  blockedBy,
  children,
  className,
}: WorkOrderCardProps) {
  const done = order.status === 'done';
  const started = order.progress > 0 && !done;

  return (
    <Card data-slot="work-order-card" data-status={order.status} className={cn('w-full min-w-0 gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <PriorityBadge priority={order.priority} />
          <span className="truncate font-mono text-xs text-muted-foreground">{order.id}</span>
        </span>
        {showStatus ? <StatusBadge status={order.status} /> : <span className="shrink-0 text-xs text-muted-foreground">{workOrderTypeLabel(order.type)}</span>}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium text-base-foreground">{order.title}</p>
        {assetTag || assetName ? (
          <p className="truncate text-xs text-muted-foreground">
            {assetTag ? <span className="font-mono">{assetTag}</span> : null}
            {assetTag && assetName ? ' ' : null}
            {assetName}
          </p>
        ) : null}
      </div>

      {blockedBy ? <p className="text-xs text-warning-foreground-strong">{blockedBy}</p> : null}

      {showProgress && started ? (
        <div className="flex items-center gap-3">
          <Progress value={order.progress} size="sm" aria-label={`${order.id} progress`} className="flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums">{order.progress}%</span>
        </div>
      ) : null}

      {children}

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <DueLabel due={due} overdue={overdue} done={done} />
          {permitRequired ? (
            <span className="inline-flex items-center gap-1 text-xs text-warning-foreground-strong">
              <IconShieldLock aria-hidden="true" className="size-3.5" />
              Permit
            </span>
          ) : null}
        </span>
        {assignee ? (
          <PersonAvatar name={assignee.name} initials={assignee.initials} colorKey={assignee.id} sizes="xsm" />
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
      </div>
    </Card>
  );
}
