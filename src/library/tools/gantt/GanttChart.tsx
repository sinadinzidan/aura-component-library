import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Separator } from '@cognite/aura/components/separator';
import { Toggle } from '@cognite/aura/components/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconAlertTriangle, IconArrowBackUp, IconArrowForwardUp, IconChevronDown, IconChevronRight, IconLock, IconX } from '@cognite/aura/icons';
import { useId, useMemo, useReducer, useRef } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { LayerSwitch } from '../../experiences/spatial/LayerSwitch';

import { GanttDetailPanel } from './GanttDetailPanel';
import { ganttReducer, initGanttState } from './ganttReducer';
import type { EditMode } from './ganttReducer';
import { PX_PER_DAY, createScale, dayToX, elbowPath, formatRange, headerCells, isWeekend, pxToDays, spanWidth, weekendRuns } from './ganttScale';
import type { GanttZoom } from './ganttScale';
import { criticalPath, findConflicts, planSpan, rollUp, visibleRows } from './ganttScheduler';
import type { GanttTask } from './ganttScheduler';

export type GanttChartProps = {
  tasks: readonly GanttTask[];
  /** The day drawn as today, as a day number. */
  today: number;
  /** Accessible name and visible title. */
  label: string;
  /** Nothing can be moved or resized. The view still scrolls, zooms and selects. */
  readOnly?: boolean;
  /** `compact` drops the toolbar overlays and the detail panel: a timeline embedded in a card. */
  variant?: 'full' | 'compact';
  initialZoom?: GanttZoom;
  initialCritical?: boolean;
  initialBaseline?: boolean;
  initialCollapsed?: readonly string[];
  initialSelection?: string | null;
  /** Hides the task list: the bars alone, as a strip. */
  hideList?: boolean;
  className?: string;
};

const ROW = 36;
const BAR_HEIGHT = 20;
const HEADER_ROW = 24;
const LIST_WIDTH = 320;
const HANDLE = 7;
const LEAD_DAYS = 7;
const TRAIL_DAYS = 14;

type Drag = { id: number; task: string; mode: EditMode; startX: number; last: number };

/**
 * A working Gantt chart. The task list on the left is an outline that collapses; the time grid on
 * the right zooms between days, weeks and months, shades weekends, draws today and the
 * finish-to-start dependencies as elbow connectors. Drag a bar to reschedule it, drag its ends to
 * change the duration; a task cannot start before its predecessors finish and later tasks are
 * pushed. With a bar focused, the arrow keys move it a day and Shift with the arrows resizes it;
 * Ctrl+Z undoes. Give it a height from its container. State is local and deterministic.
 */
export function GanttChart({
  tasks,
  today,
  label,
  readOnly = false,
  variant = 'full',
  initialZoom = 'day',
  initialCritical = false,
  initialBaseline = false,
  initialCollapsed = [],
  initialSelection = null,
  hideList = false,
  className,
}: GanttChartProps) {
  const compact = variant === 'compact';
  const locked = readOnly || compact;
  const [state, dispatch] = useReducer(ganttReducer, tasks, (initial) => initGanttState(initial, { zoom: initialZoom, critical: initialCritical, baseline: initialBaseline, collapsed: initialCollapsed, selection: initialSelection }));
  const drag = useRef<Drag | null>(null);
  const markerId = `gantt-arrow-${useId().replace(/:/g, '')}`;

  const initialSpan = useMemo(() => (tasks.length > 0 ? planSpan(tasks) : { start: today, end: today + 28 }), [tasks, today]);
  const origin = initialSpan.start - LEAD_DAYS;
  const current = state.tasks.length > 0 ? planSpan(state.tasks) : initialSpan;
  const finishDay = Math.max(initialSpan.end, current.end, today) + TRAIL_DAYS;
  const scale = createScale(origin, state.zoom);
  const totalDays = finishDay - origin;
  const width = spanWidth(scale, totalDays);

  const rows = visibleRows(state.tasks, new Set(state.collapsed));
  const rolled = useMemo(() => rollUp(state.tasks), [state.tasks]);
  const path = useMemo(() => criticalPath(state.tasks), [state.tasks]);
  const conflicts = useMemo(() => findConflicts(state.tasks), [state.tasks]);
  const conflicted = new Set(conflicts.map((conflict) => conflict.taskId));
  const rowOf = new Map(rows.map((row, index) => [row.task.id, index]));
  const header = headerCells(state.zoom, origin, finishDay);
  const height = rows.length * ROW;
  const selected = state.selection ? state.tasks.find((candidate) => candidate.id === state.selection) : undefined;
  const selectedSpan = selected ? rolled.get(selected.id) : undefined;

  const beginDrag = (taskId: string, mode: EditMode) => (event: PointerEvent<SVGGElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    dispatch({ type: 'select', id: taskId });
    if (locked) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: event.pointerId, task: taskId, mode, startX: event.clientX, last: 0 };
    dispatch({ type: 'beginEdit' });
  };

  const moveDrag = (event: PointerEvent<SVGGElement>) => {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    const baseStart = rolled.get(active.task)?.start ?? origin;
    // Never drag before the first day of the grid.
    const minDays = active.mode === 'end' ? Number.NEGATIVE_INFINITY : origin - baseStart;
    const days = Math.max(minDays, pxToDays(scale, event.clientX - active.startX));
    if (days === active.last) return;
    active.last = days;
    dispatch({ type: 'drag', mode: active.mode, id: active.task, days });
  };

  const endDrag = (event: PointerEvent<SVGGElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    drag.current = null;
    dispatch({ type: 'endEdit' });
  };

  const handleBarKeyDown = (task: GanttTask) => (event: KeyboardEvent<SVGGElement>) => {
    const meta = event.ctrlKey || event.metaKey;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch({ type: 'select', id: task.id });
    } else if (event.key === 'Escape') {
      if (drag.current) {
        drag.current = null;
        dispatch({ type: 'cancelEdit' });
      } else dispatch({ type: 'select', id: null });
    } else if (!locked && meta && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
    } else if (!locked && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const days = event.key === 'ArrowRight' ? 1 : -1;
      dispatch({ type: 'nudge', mode: event.shiftKey ? 'end' : 'move', id: task.id, days });
    }
  };

  const toolButton = (name: string, icon: ReactNode, onClick: () => void, disabled: boolean) => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={name} disabled={disabled} onClick={onClick}>
            {icon}
          </Button>
        }
      />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );

  const xStart = (id: string) => dayToX(scale, rolled.get(id)?.start ?? origin);
  const xEnd = (id: string) => {
    const span = rolled.get(id);
    return dayToX(scale, span ? (span.end === span.start ? span.start : span.end) : origin);
  };
  const midY = (id: string) => (rowOf.get(id) ?? 0) * ROW + ROW / 2;
  const todayX = dayToX(scale, today) + PX_PER_DAY[state.zoom] / 2;

  const connectors = rows.flatMap(({ task }) =>
    task.after
      .filter((predId) => rowOf.has(predId))
      .map((predId) => {
        const broken = conflicts.some((conflict) => conflict.taskId === task.id && conflict.predecessorId === predId);
        const onCritical = state.critical && path.critical.has(task.id) && path.critical.has(predId);
        return { key: `${predId}-${task.id}`, d: elbowPath({ x: xEnd(predId), y: midY(predId) }, { x: xStart(task.id), y: midY(task.id) }, ROW), broken, onCritical };
      })
  );

  return (
    <div data-slot="gantt-chart" data-variant={variant} data-read-only={locked} className={cn('flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background', className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-default px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-base-foreground">{label}</span>
        <span className="flex-1" />
        {locked && !compact ? (
          <Badge variant="secondary">
            <IconLock aria-hidden="true" /> Read-only
          </Badge>
        ) : null}
        {compact ? null : (
          <>
            <Toggle size="sm" pressed={state.critical} onPressedChange={() => dispatch({ type: 'toggleCritical' })} label="Critical path" />
            <Toggle size="sm" pressed={state.baseline} onPressedChange={() => dispatch({ type: 'toggleBaseline' })} label="Baseline" />
            {locked ? null : (
              <div role="toolbar" aria-label="Edit" className="flex items-center gap-1">
                {toolButton('Undo', <IconArrowBackUp />, () => dispatch({ type: 'undo' }), state.past.length === 0)}
                {toolButton('Redo', <IconArrowForwardUp />, () => dispatch({ type: 'redo' }), state.future.length === 0)}
              </div>
            )}
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          </>
        )}
        <LayerSwitch
          label="Zoom"
          value={state.zoom}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          onValueChange={(zoom) => dispatch({ type: 'setZoom', zoom })}
        />
      </div>

      {state.conflict ? (
        <p role="alert" data-slot="gantt-conflict" className="flex shrink-0 items-center gap-2 border-b border-default bg-critical-background px-3 py-1.5 text-sm text-critical-foreground">
          <IconAlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">{state.conflict}</span>
          <Button variant="ghost" size="icon-sm" aria-label="Dismiss message" onClick={() => dispatch({ type: 'dismissConflict' })}>
            <IconX />
          </Button>
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div data-slot="gantt-scroll" className="min-h-0 min-w-0 flex-1 overflow-auto" role="region" aria-label={`${label}, scrollable`} tabIndex={0}>
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">This plan has no tasks yet.</p>
          ) : (
            <div className="relative flex" style={{ width: (hideList ? 0 : LIST_WIDTH) + width, minHeight: HEADER_ROW * 2 + height }}>
              {hideList ? null : (
                <div className="sticky left-0 z-20 shrink-0 border-r border-default bg-base-background" style={{ width: LIST_WIDTH }}>
                  <div className="sticky top-0 z-10 flex items-end border-b border-default bg-base-background px-3 pb-1 text-xs font-medium text-muted-foreground" style={{ height: HEADER_ROW * 2 }}>
                    <span className="flex-1">Task</span>
                    <span>Starts</span>
                  </div>
                  <ul aria-label="Tasks">
                    {rows.map(({ task, depth, hasChildren, collapsed }) => {
                      const span = rolled.get(task.id);
                      const isSelected = state.selection === task.id;
                      return (
                        <li key={task.id} data-task={task.id} data-selected={isSelected} className={cn('flex items-center gap-1 pr-3', isSelected && 'bg-muted-background')} style={{ height: ROW, paddingLeft: 8 + depth * 16 }}>
                          {hasChildren ? (
                            <button
                              type="button"
                              aria-expanded={!collapsed}
                              aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${task.name}`}
                              onClick={() => dispatch({ type: 'toggleCollapse', id: task.id })}
                              className="flex size-5 shrink-0 items-center justify-center rounded-md text-medium-foreground outline-none hover:bg-medium-background focus-visible:ring-2 focus-visible:ring-ring-default"
                            >
                              {collapsed ? <IconChevronRight className="size-4" /> : <IconChevronDown className="size-4" />}
                            </button>
                          ) : (
                            <span className="size-5 shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'select', id: task.id })}
                            aria-current={isSelected ? 'true' : undefined}
                            className={cn('min-w-0 flex-1 truncate rounded-md px-1 py-0.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring-default', task.kind === 'group' ? 'font-medium text-base-foreground' : 'text-base-foreground')}
                          >
                            {task.name}
                          </button>
                          {conflicted.has(task.id) ? (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-critical-foreground-strong">
                              <IconAlertTriangle aria-hidden="true" className="size-3.5" />
                              <span className="sr-only">Starts before a predecessor finishes</span>
                            </span>
                          ) : state.critical && path.critical.has(task.id) ? (
                            <span className="shrink-0 text-xs font-medium text-critical-foreground-strong">Critical</span>
                          ) : null}
                          <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{span ? formatRange(span.start, 1) : ''}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="relative shrink-0" style={{ width }}>
                <div className="sticky top-0 z-10 border-b border-default bg-base-background" style={{ height: HEADER_ROW * 2, width }} aria-hidden="true">
                  {([header.top, header.bottom] as const).map((cells, rowIndex) => (
                    <div key={rowIndex} className="relative" style={{ height: HEADER_ROW }}>
                      {cells.map((cell) => (
                        <span
                          key={cell.key}
                          className={cn('absolute top-0 flex items-center overflow-hidden border-l border-default px-1.5 text-xs whitespace-nowrap tabular-nums', rowIndex === 0 ? 'font-medium text-base-foreground' : 'text-muted-foreground')}
                          style={{ left: dayToX(scale, cell.from), width: spanWidth(scale, cell.to - cell.from), height: HEADER_ROW }}
                        >
                          {rowIndex === 1 && state.zoom === 'day' ? (
                            <span className={cn('flex flex-col leading-none', isWeekend(cell.from) && 'opacity-70')}>
                              <span>{cell.label}</span>
                            </span>
                          ) : (
                            cell.label
                          )}
                        </span>
                      ))}
                    </div>
                  ))}
                  <span className="absolute rounded-sm bg-base-foreground px-1 text-xs leading-4 font-medium text-base-background" style={{ left: todayX, transform: 'translateX(-50%)', top: 4 }}>
                    Today
                  </span>
                </div>

                <svg data-slot="gantt-grid" width={width} height={height} fill="none" className="block" aria-label={`${label}, time grid`} role="group">
                  <defs>
                    {(['default', 'critical', 'broken'] as const).map((kind) => (
                      <marker key={kind} id={`${markerId}-${kind}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto" className={kind === 'critical' || kind === 'broken' ? 'text-critical-foreground-strong' : 'text-medium-foreground'}>
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
                      </marker>
                    ))}
                  </defs>

                  {weekendRuns(origin, finishDay).map((run) => (
                    <rect key={run.from} data-slot="gantt-weekend" x={dayToX(scale, run.from)} y={0} width={spanWidth(scale, run.to - run.from)} height={height} className="fill-muted-background" />
                  ))}
                  {rows.map((row, index) => (
                    <line key={row.task.id} x1={0} x2={width} y1={(index + 1) * ROW} y2={(index + 1) * ROW} strokeWidth={1} className="stroke-default" />
                  ))}
                  {header.bottom.map((cell) => (
                    <line key={cell.key} x1={dayToX(scale, cell.from)} x2={dayToX(scale, cell.from)} y1={0} y2={height} strokeWidth={1} className="stroke-default" opacity={0.6} />
                  ))}
                  <line data-slot="gantt-today" x1={todayX} x2={todayX} y1={0} y2={height} strokeWidth={1.5} className="stroke-base-foreground" />

                  <g data-slot="gantt-dependencies">
                    {connectors.map((connector) => (
                      <path
                        key={connector.key}
                        data-dependency={connector.key}
                        data-broken={connector.broken}
                        d={connector.d}
                        strokeWidth={connector.broken || connector.onCritical ? 1.5 : 1}
                        strokeDasharray={connector.broken ? '4 3' : undefined}
                        markerEnd={`url(#${markerId}-${connector.broken ? 'broken' : connector.onCritical ? 'critical' : 'default'})`}
                        className={connector.broken || connector.onCritical ? 'stroke-critical-foreground-strong' : 'stroke-medium-foreground'}
                      >
                        <title>{connector.broken ? 'Starts before the predecessor finishes' : 'Finish to start'}</title>
                      </path>
                    ))}
                  </g>

                  {rows.map(({ task }, index) => {
                    const span = rolled.get(task.id);
                    if (!span) return null;
                    const x = dayToX(scale, span.start);
                    const w = Math.max(spanWidth(scale, span.end - span.start), 0);
                    const y = index * ROW + (ROW - BAR_HEIGHT) / 2;
                    const isSelected = state.selection === task.id;
                    const critical = state.critical && path.critical.has(task.id);
                    const broken = conflicted.has(task.id);
                    const slip = task.baseline ? span.start - task.baseline.start : 0;
                    const name = `${task.name}, ${task.kind === 'milestone' ? `milestone, ${formatRange(span.start, 1)}` : `${formatRange(span.start, span.end - span.start)}, ${span.end - span.start} days, ${span.progress} percent complete`}${critical ? ', on the critical path' : ''}${broken ? ', starts before a predecessor finishes' : ''}${task.baseline && slip !== 0 ? `, ${Math.abs(slip)} days ${slip > 0 ? 'later' : 'earlier'} than baseline` : ''}`;
                    const editable = !locked && task.kind !== 'milestone';
                    return (
                      <g key={task.id}>
                        {state.baseline && task.baseline && task.kind !== 'group' ? (
                          <rect data-slot="gantt-baseline" x={dayToX(scale, task.baseline.start)} y={index * ROW + ROW - 9} width={Math.max(spanWidth(scale, task.baseline.duration), 3)} height={4} rx={2} className="fill-muted-foreground" opacity={0.7}>
                            <title>{`Baseline ${formatRange(task.baseline.start, task.baseline.duration)}`}</title>
                          </rect>
                        ) : null}
                        <g
                          data-slot="gantt-bar"
                          data-task={task.id}
                          data-kind={task.kind}
                          data-selected={isSelected}
                          data-critical={critical}
                          data-conflict={broken}
                          role="button"
                          tabIndex={0}
                          aria-label={name}
                          aria-pressed={isSelected}
                          onPointerDown={beginDrag(task.id, 'move')}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                          onKeyDown={handleBarKeyDown(task)}
                          className={cn('group outline-none', editable || task.kind === 'group' ? (locked ? 'cursor-pointer' : 'cursor-grab') : 'cursor-pointer')}
                        >
                          {task.kind === 'milestone' ? (
                            <path d={`M ${x} ${y - 1} l 10 11 l -10 11 l -10 -11 Z`} strokeWidth={isSelected ? 2 : 1.5} vectorEffect="non-scaling-stroke" className={cn(critical ? 'fill-chart-critical-450 stroke-critical-foreground-strong' : 'fill-base-foreground stroke-base-foreground', 'group-focus-visible:stroke-ring-default')} />
                          ) : task.kind === 'group' ? (
                            <path d={`M ${x} ${y + 4} h ${w} v 12 l -5 -5 h ${-(w - 10)} l -5 5 Z`} className={cn('fill-medium-foreground group-focus-visible:fill-base-foreground', isSelected && 'fill-base-foreground')} />
                          ) : (
                            <>
                              <rect x={x} y={y} width={w} height={BAR_HEIGHT} rx={4} strokeWidth={isSelected ? 2 : 1} vectorEffect="non-scaling-stroke" className={cn(critical ? 'fill-chart-critical-200 stroke-critical-foreground-strong' : broken ? 'fill-chart-critical-100 stroke-critical-foreground-strong' : 'fill-chart-1-200 stroke-chart-1-450', isSelected && 'stroke-base-foreground', 'group-focus-visible:stroke-ring-default')} strokeDasharray={broken ? '4 3' : undefined} />
                              <rect x={x} y={y} width={(w * span.progress) / 100} height={BAR_HEIGHT} rx={4} className={critical || broken ? 'fill-chart-critical-450' : 'fill-chart-1-450'} />
                              {editable ? (
                                <>
                                  <rect data-handle="start" x={x - 2} y={y} width={HANDLE} height={BAR_HEIGHT} className="cursor-ew-resize fill-transparent" onPointerDown={beginDrag(task.id, 'start')} />
                                  <rect data-handle="end" x={x + w - HANDLE + 2} y={y} width={HANDLE} height={BAR_HEIGHT} className="cursor-ew-resize fill-transparent" onPointerDown={beginDrag(task.id, 'end')} />
                                </>
                              ) : null}
                            </>
                          )}
                          {broken ? (
                            <g data-slot="gantt-conflict-mark">
                              <circle cx={x - 12} cy={index * ROW + ROW / 2} r={7} className="fill-critical-background stroke-critical-foreground-strong" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                              <text x={x - 12} y={index * ROW + ROW / 2} fontSize={10} textAnchor="middle" dominantBaseline="central" className="fill-critical-foreground-strong font-semibold">
                                !
                              </text>
                            </g>
                          ) : null}
                        </g>
                        {task.resource && task.kind !== 'group' ? (
                          <text x={x + w + (task.kind === 'milestone' ? 14 : 8)} y={index * ROW + ROW / 2} fontSize={11} dominantBaseline="central" className="pointer-events-none fill-muted-foreground">
                            {task.resource}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {!compact && selected && selectedSpan ? (
          <div className="w-72 max-w-[45%] shrink-0">
            <GanttDetailPanel task={selected} tasks={state.tasks} span={selectedSpan} critical={path.critical.has(selected.id)} float={path.float.get(selected.id)} conflicts={conflicts} onClose={() => dispatch({ type: 'select', id: null })} />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-x-4 overflow-hidden border-t border-default px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground">
        {compact ? null : (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" viewBox="0 0 16 10" className="h-2.5 w-4">
                <rect width={16} height={10} rx={2} className="fill-chart-1-200 stroke-chart-1-450" />
                <rect width={9} height={10} rx={2} className="fill-chart-1-450" />
              </svg>
              Task and progress
            </span>
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3">
                <path d="M 6 0 L 12 6 L 6 12 L 0 6 Z" className="fill-base-foreground" />
              </svg>
              Milestone
            </span>
          </span>
        )}
        <span className="min-w-0 truncate">{locked ? 'Scroll to move through time.' : 'Drag a bar to reschedule it. Drag an end to change its duration.'}</span>
        <span role="status" aria-label="Chart activity" aria-live="polite" className="ml-auto min-w-0 max-w-[55%] truncate tabular-nums">
          {state.message}
        </span>
      </div>
    </div>
  );
}
