import { Loader } from '@cognite/aura/components/loader';
import { IconAlertCircle, IconCircleCheck, IconCircleDashed, IconShieldQuestion } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { summarizeTasks } from './summarizeTasks';
import type { AgentTask, AgentTaskStatus } from './summarizeTasks';

export type { AgentTask, AgentTaskStatus } from './summarizeTasks';

export type TaskProgressListProps = {
  /** What the agent is working on. Also the accessible name. */
  label: string;
  tasks: readonly AgentTask[];
  /** Controls after the summary: stop, or review the step that waits. */
  actions?: ReactNode;
};

const STATUS_LABEL: Record<AgentTaskStatus, string> = {
  done: 'Done',
  running: 'Running',
  queued: 'Queued',
  failed: 'Failed',
  waiting: 'Needs approval',
};

function statusIcon(status: AgentTaskStatus): ReactNode {
  switch (status) {
    case 'done':
      return <IconCircleCheck aria-hidden className="size-4 text-success-foreground-strong" />;
    case 'running':
      return <Loader size={16} aria-hidden="true" />;
    case 'queued':
      return <IconCircleDashed aria-hidden className="size-4 text-muted-foreground" />;
    case 'failed':
      return <IconAlertCircle aria-hidden className="size-4 text-critical-foreground-strong" />;
    case 'waiting':
      return <IconShieldQuestion aria-hidden className="size-4 text-warning-foreground-strong" />;
  }
}

/**
 * The plan of a long-running agent task as a list of steps with their state: done, running,
 * queued, failed or waiting for a person. Every state has an icon and a written label, and the
 * summary line says where the run stands without reading the list.
 */
export function TaskProgressList({ label, tasks, actions }: TaskProgressListProps) {
  return (
    <div data-slot="task-progress" className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-base-foreground">{label}</span>
          <span role="status" className="text-xs tabular-nums text-muted-foreground">
            {summarizeTasks(tasks)}
          </span>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <ol aria-label={label} className="flex flex-col">
        {tasks.map((task) => (
          <li
            key={task.id}
            data-status={task.status}
            aria-current={task.status === 'running' ? 'step' : undefined}
            className="flex items-start gap-3 py-1.5"
          >
            <span className="flex h-5 w-4 shrink-0 items-center justify-center">{statusIcon(task.status)}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn('text-sm', task.status === 'queued' ? 'text-muted-foreground' : 'text-base-foreground')}>{task.label}</span>
              {task.detail ? <span className="text-xs text-muted-foreground">{task.detail}</span> : null}
            </span>
            <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{STATUS_LABEL[task.status]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
