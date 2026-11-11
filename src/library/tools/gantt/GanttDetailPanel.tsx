import { IconAlertTriangle } from '@cognite/aura/icons';

import { StatusIndicator } from '../../industrial/StatusIndicator';
import { PropertyList } from '../../patterns/structure/PropertyList';
import { SidePanel } from '../../patterns/structure/SidePanel';

import { formatDay, formatDuration, formatRange } from './ganttScale';
import { byId } from './ganttScheduler';
import type { Conflict, GanttTask, RolledUp } from './ganttScheduler';

export type GanttDetailPanelProps = {
  task: GanttTask;
  tasks: readonly GanttTask[];
  /** Start, end and progress as drawn; groups have no dates of their own. */
  span: RolledUp;
  critical: boolean;
  /** Days the task can slip without moving the finish. */
  float?: number;
  conflicts: readonly Conflict[];
  onClose?: () => void;
};

/** Facts about the selected bar: dates, duration, progress, crew, predecessors, slip against baseline and conflicts. */
export function GanttDetailPanel({ task, tasks, span, critical, float, conflicts, onClose }: GanttDetailPanelProps) {
  const index = byId(tasks);
  const slip = task.baseline ? span.start - task.baseline.start : 0;
  const mine = conflicts.filter((conflict) => conflict.taskId === task.id);
  const duration = span.end - span.start;
  const predecessors = task.after.map((id) => index.get(id)?.name ?? id);
  const successors = tasks.filter((candidate) => candidate.after.includes(task.id)).map((candidate) => candidate.name);

  return (
    <SidePanel
      title={task.name}
      description={task.kind === 'group' ? 'Group' : task.kind === 'milestone' ? 'Milestone' : 'Task'}
      status={critical ? <StatusIndicator tone="critical" shape="diamond" label="Critical" size="sm" /> : undefined}
      onClose={onClose}
      frame="edge"
    >
      <div data-slot="gantt-detail" className="flex flex-col gap-4">
        {mine.length > 0 ? (
          <p role="alert" className="flex items-start gap-2 rounded-md bg-critical-background p-2 text-sm text-critical-foreground">
            <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              Starts {mine[0].overlap} {mine[0].overlap === 1 ? 'day' : 'days'} before {index.get(mine[0].predecessorId)?.name ?? 'its predecessor'} finishes. Move it later to fix the plan.
            </span>
          </p>
        ) : null}
        <PropertyList
          dense
          items={[
            { label: 'Dates', value: <span className="tabular-nums">{formatRange(span.start, duration)}</span> },
            { label: 'Duration', value: <span className="tabular-nums">{formatDuration(duration)}</span> },
            { label: 'Progress', value: <span className="tabular-nums">{span.progress}%</span> },
            { label: 'Crew', value: task.resource },
            { label: 'Float', value: float === undefined ? undefined : <span className="tabular-nums">{float === 0 ? 'None' : `${float} ${float === 1 ? 'day' : 'days'}`}</span> },
            {
              label: 'Against baseline',
              value: task.baseline ? (
                <span className="tabular-nums">{slip === 0 ? `On baseline (${formatDay(task.baseline.start)})` : `${slip > 0 ? '+' : '−'}${Math.abs(slip)} ${Math.abs(slip) === 1 ? 'day' : 'days'} (baseline ${formatDay(task.baseline.start)})`}</span>
              ) : undefined,
            },
            { label: 'Starts after', value: predecessors.length > 0 ? predecessors.join(', ') : undefined },
            { label: 'Followed by', value: successors.length > 0 ? successors.join(', ') : undefined },
          ]}
        />
        {task.kind === 'task' ? <p className="text-xs text-muted-foreground">Drag the bar to move it. Drag an end to change the duration. With the bar focused, arrow keys move it a day and Shift with arrows changes the duration.</p> : null}
      </div>
    </SidePanel>
  );
}
