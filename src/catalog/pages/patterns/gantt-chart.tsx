import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconTimeline } from '@cognite/aura/icons';

import { ThemeScope } from '../../../library/themes/ThemeScope';
import { GanttChart } from '../../../library/tools/gantt/GanttChart';
import { GanttDetailPanel } from '../../../library/tools/gantt/GanttDetailPanel';
import { CONFLICT_TASKS, GANTT_TODAY, MAINTENANCE_WEEK_TASKS, TURNAROUND_TASKS } from '../../../library/tools/gantt/ganttFixtures';
import { criticalPath, findConflicts, rollUp } from '../../../library/tools/gantt/ganttScheduler';
import type { GanttTask } from '../../../library/tools/gantt/ganttScheduler';
import { definePage } from '../../types';

import source from './gantt-chart.tsx?raw';

const pick = (tasks: readonly GanttTask[], ...ids: string[]): GanttTask[] => tasks.filter((task) => ids.includes(task.id));

/** A few rows that show each bar: a task with progress, a late task, a group, a milestone. */
const BAR_SAMPLES: readonly GanttTask[] = pick(TURNAROUND_TASKS, 'iso', 'shut', 'depr', 'loto', 'start');
const MILESTONES: readonly GanttTask[] = pick(TURNAROUND_TASKS, 'start', 'hand').map((task) => ({ ...task, parentId: null }));
const DEPENDENCIES: readonly GanttTask[] = pick(TURNAROUND_TASKS, 'ka1', 'fw', 'box', 'pur').map((task) => ({ ...task, parentId: null }));
const GROUPS_COLLAPSED = ['prep', 'iso', 'inst', 'rec'];

function GanttChartFull() {
  return (
    <div className="h-176 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Compression train turnaround, March 2026" initialZoom="week" />
    </div>
  );
}

function GanttChartMaintenanceWeek() {
  return (
    <div className="h-120 w-full">
      <GanttChart tasks={MAINTENANCE_WEEK_TASKS} today={GANTT_TODAY} label="Maintenance week 11, Nordkapp" />
    </div>
  );
}

function GanttChartDarkScope() {
  return (
    <ThemeScope preset="control-room" className="h-176 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Compression train turnaround, March 2026" initialCritical initialSelection="ka1" initialZoom="week" />
    </ThemeScope>
  );
}

function GanttChartCompactTimeline() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>This week</CardTitle>
          <CardDescription>Jobs planned for the compression train. Open the plan to change them.</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-96 w-full">
          <GanttChart tasks={MAINTENANCE_WEEK_TASKS} today={GANTT_TODAY} label="Jobs this week" variant="compact" />
        </div>
      </CardContent>
    </Card>
  );
}

function GanttChartReadOnly() {
  return (
    <div className="h-120 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Compression train turnaround, approved plan" readOnly initialCollapsed={GROUPS_COLLAPSED} />
    </div>
  );
}

function GanttChartBarVariants() {
  return (
    <div className="h-80 w-full">
      <GanttChart tasks={BAR_SAMPLES} today={GANTT_TODAY} label="Bar variants: group, task with progress, milestone" variant="compact" />
    </div>
  );
}

function GanttChartMilestones() {
  return (
    <div className="h-64 w-full">
      <GanttChart tasks={MILESTONES} today={GANTT_TODAY} label="Milestones: turnaround starts and handover" variant="compact" initialZoom="week" />
    </div>
  );
}

function GanttChartDependencies() {
  return (
    <div className="h-80 w-full">
      <GanttChart tasks={DEPENDENCIES} today={GANTT_TODAY} label="Finish-to-start dependencies as elbow connectors" variant="compact" initialZoom="week" />
    </div>
  );
}

function GanttChartZoomLevels() {
  return (
    <div className="flex w-full flex-col gap-4">
      {(['day', 'week', 'month'] as const).map((zoom) => (
        <div key={zoom} className="h-72 w-full">
          <GanttChart tasks={MAINTENANCE_WEEK_TASKS} today={GANTT_TODAY} label={`Maintenance week at ${zoom} zoom`} variant="compact" initialZoom={zoom} />
        </div>
      ))}
    </div>
  );
}

function GanttChartGroupedRows() {
  return (
    <div className="h-96 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Turnaround with every group collapsed" initialCollapsed={GROUPS_COLLAPSED} initialZoom="week" />
    </div>
  );
}

function GanttChartBaseline() {
  return (
    <div className="h-120 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Turnaround against its baseline" initialBaseline initialSelection="shut" />
    </div>
  );
}

function GanttChartCriticalPath() {
  return (
    <div className="h-120 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Turnaround critical path" initialCritical initialZoom="week" />
    </div>
  );
}

function GanttChartConflict() {
  return (
    <div className="h-120 w-full">
      <GanttChart tasks={CONFLICT_TASKS} today={GANTT_TODAY} label="Turnaround with a broken dependency" initialSelection="ka2" />
    </div>
  );
}

function GanttChartDense() {
  return (
    <div className="h-96 w-full">
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="The whole turnaround at month zoom" variant="compact" initialZoom="month" hideList />
    </div>
  );
}

function GanttChartDetailPanelDemo() {
  const task = TURNAROUND_TASKS.find((candidate) => candidate.id === 'ka1');
  const span = rollUp(TURNAROUND_TASKS).get('ka1');
  const path = criticalPath(TURNAROUND_TASKS);
  if (!task || !span) return null;
  return (
    <div className="h-136 w-full max-w-sm">
      <GanttDetailPanel task={task} tasks={TURNAROUND_TASKS} span={span} critical={path.critical.has(task.id)} float={path.float.get(task.id)} conflicts={findConflicts(TURNAROUND_TASKS)} />
    </div>
  );
}

function GanttChartDetailConflict() {
  const task = CONFLICT_TASKS.find((candidate) => candidate.id === 'ka2');
  const span = rollUp(CONFLICT_TASKS).get('ka2');
  const path = criticalPath(CONFLICT_TASKS);
  if (!task || !span) return null;
  return (
    <div className="h-136 w-full max-w-sm">
      <GanttDetailPanel task={task} tasks={CONFLICT_TASKS} span={span} critical={path.critical.has(task.id)} float={path.float.get(task.id)} conflicts={findConflicts(CONFLICT_TASKS)} />
    </div>
  );
}

function GanttChartLoading() {
  return (
    <div role="status" aria-label="Loading plan" className="flex h-80 w-full flex-col gap-3 rounded-xl border border-default p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-56" />
        <span className="flex-1" />
        <Skeleton className="h-9 w-40" />
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 flex-1" />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Loading the turnaround plan.</p>
    </div>
  );
}

function GanttChartEmpty() {
  return (
    <div className="flex h-80 w-full items-center justify-center rounded-xl border border-default">
      <EmptyState type="new-object">
        <EmptyStateIcon>
          <IconTimeline />
        </EmptyStateIcon>
        <div className="flex flex-col items-center gap-2">
          <EmptyStateTitle as="h2">No tasks in this plan</EmptyStateTitle>
          <EmptyStateDescription>Add the first task or import a schedule. Bars, dependencies and the critical path appear here.</EmptyStateDescription>
        </div>
      </EmptyState>
    </div>
  );
}

function GanttChartEmptyPlan() {
  return (
    <div className="h-64 w-full">
      <GanttChart tasks={[]} today={GANTT_TODAY} label="New plan" />
    </div>
  );
}

export default definePage({
  id: 'gantt-chart',
  title: 'Gantt chart',
  summary:
    'A working Gantt: a collapsible task list beside a day, week and month time grid. Drag bars to reschedule, drag their ends to change duration, and a scheduler keeps every finish-to-start dependency true, pushes successors and highlights the critical path. Data is the Nordkapp turnaround and a maintenance week.',
  guidance: {
    use: [
      'Work has durations and dependencies, and people need to see what moves when one job slips.',
      'A planner reschedules by dragging, and the plan must refuse a change that breaks a dependency and say why.',
      'The critical path and baseline matter, as in a turnaround or shutdown.',
    ],
    avoid: [
      'A handful of independent jobs. Use a schedule strip or a list with due dates.',
      'Dragging as the only way to reschedule. Every move and resize is also available from the keyboard.',
      'Showing the critical path in colour alone. Name it in the list and the bar label as well.',
    ],
  },
  source,
  sections: [
    {
      id: 'charts',
      title: 'The chart',
      description: 'Working plans. Drag a bar, drag its ends, or focus a bar and press the arrow keys. Shift with the arrows changes the duration. Ctrl+Z undoes.',
      specimens: [
        {
          id: 'GanttChartFull',
          title: 'Turnaround plan',
          note: 'Pick it as the main planning screen: list, grid, critical path, baseline, detail panel and undo.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx', 'tools/gantt/ganttScheduler.ts', 'tools/gantt/ganttReducer.ts', 'tools/gantt/ganttScale.ts'],
          Component: GanttChartFull,
        },
        {
          id: 'GanttChartMaintenanceWeek',
          title: 'Maintenance week',
          note: 'Pick it for a short horizon in days: jobs per technician, with the dependencies between inspections.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartMaintenanceWeek,
        },
        {
          id: 'GanttChartDarkScope',
          title: 'Dark theme with critical path',
          note: 'Pick it for control rooms and night planning: the same chart in the control-room theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx', 'themes/ThemeScope.tsx'],
          Component: GanttChartDarkScope,
        },
        {
          id: 'GanttChartReadOnly',
          title: 'Read-only plan',
          note: 'Pick it for an approved plan: bars select and scroll but cannot be moved, with groups folded away.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartReadOnly,
        },
        {
          id: 'GanttChartCompactTimeline',
          title: 'Compact timeline',
          note: 'Pick it for an overview page: the week as a read-only timeline in a card, no toolbar and no panel.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartCompactTimeline,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Bars, milestones and dependencies',
      description: 'What a plan is drawn with, one thing at a time.',
      specimens: [
        {
          id: 'GanttChartBarVariants',
          title: 'Bar variants',
          note: 'Pick it to see the marks: a group bracket, task bars with progress filled in, and a milestone diamond.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartBarVariants,
        },
        {
          id: 'GanttChartMilestones',
          title: 'Milestones',
          note: 'Pick milestones for events with no duration: start of the turnaround and handover to production.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartMilestones,
        },
        {
          id: 'GanttChartDependencies',
          title: 'Dependencies',
          note: 'Pick it for logic: finish-to-start links leave the end of a bar and enter the start of the next one.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx', 'tools/gantt/ganttScale.ts'],
          Component: GanttChartDependencies,
        },
        {
          id: 'GanttChartZoomLevels',
          title: 'Zoom levels',
          note: 'Pick the zoom for the horizon: days for the week ahead, weeks for the month, months for the year.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx', 'tools/gantt/ganttScale.ts'],
          Component: GanttChartZoomLevels,
        },
        {
          id: 'GanttChartGroupedRows',
          title: 'Grouped rows',
          note: 'Pick it to read a long plan at a glance: collapsed groups show their whole span as one bracket.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartGroupedRows,
        },
        {
          id: 'GanttChartDense',
          title: 'Dense, bars only',
          note: 'Pick it for a poster view of a whole plan at month zoom, without the task list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartDense,
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Baseline, critical path and conflicts',
      description: 'The views that answer whether the plan will hold.',
      specimens: [
        {
          id: 'GanttChartBaseline',
          title: 'Baseline comparison',
          note: 'Pick it to see slip: a thin grey bar under each task shows where it was first planned.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartBaseline,
        },
        {
          id: 'GanttChartCriticalPath',
          title: 'Critical path',
          note: 'Pick it to see which jobs decide the finish: critical bars and links are red and named in the list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx', 'tools/gantt/ganttScheduler.ts'],
          Component: GanttChartCriticalPath,
        },
        {
          id: 'GanttChartConflict',
          title: 'Conflict state',
          note: 'Pick it to show a broken dependency: a dashed bar, a mark, a dashed connector and a plain explanation.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx', 'tools/gantt/GanttDetailPanel.tsx'],
          Component: GanttChartConflict,
        },
        {
          id: 'GanttChartDetailPanelDemo',
          title: 'Detail panel',
          note: 'Pick it for the facts about one bar: dates, duration, progress, crew, float and slip against baseline.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/gantt/GanttDetailPanel.tsx', 'patterns/structure/PropertyList.tsx'],
          Component: GanttChartDetailPanelDemo,
        },
        {
          id: 'GanttChartDetailConflict',
          title: 'Detail panel, conflict',
          note: 'Pick it to explain a conflict where it is selected: how many days early, and against which task.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/gantt/GanttDetailPanel.tsx'],
          Component: GanttChartDetailConflict,
        },
      ],
    },
    {
      id: 'states',
      title: 'Loading and empty',
      description: 'The plan before it exists or arrives.',
      specimens: [
        {
          id: 'GanttChartLoading',
          title: 'Loading',
          note: 'Pick it while a plan is fetched; it keeps the layout of a list beside a grid.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: GanttChartLoading,
        },
        {
          id: 'GanttChartEmpty',
          title: 'Empty plan',
          note: 'Pick it for a new plan: say what will appear and how to start.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: GanttChartEmpty,
        },
        {
          id: 'GanttChartEmptyPlan',
          title: 'Empty in the chart',
          note: 'Pick it when the chart itself is given no tasks, such as after every task is filtered out.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/gantt/GanttChart.tsx'],
          Component: GanttChartEmptyPlan,
        },
      ],
    },
  ],
});
