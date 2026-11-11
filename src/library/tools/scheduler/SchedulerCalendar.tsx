import { Button } from '@cognite/aura/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconArrowBackUp, IconArrowForwardUp, IconChevronLeft, IconChevronRight, IconPlus } from '@cognite/aura/icons';
import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { cn } from '../../../lib/utils';
import { IconAction } from '../../patterns/collections/IconAction';
import { layoutEvents } from '../../patterns/workflows/layoutEvents';

import { conflictsOf, findConflicts } from './conflicts';
import type { Conflict, ConflictRules, SchedEvent } from './conflicts';
import { CREW_TONES } from './crewTones';
import { EventBlock } from './EventBlock';
import { EventDetailPanel } from './EventDetailPanel';
import { EventForm } from './EventForm';
import type { EventFormValues } from './EventForm';
import { columnIndexAt, columnOf, draftFromDrag, movedTo, nudge, resizedTo } from './geometry';
import type { NudgeKey, Placement, SchedColumn } from './geometry';
import { createSchedulerState, schedulerReducer } from './schedulerReducer';
import type { Draft } from './schedulerReducer';
import { formatClock, formatSpan, longDayLabel, pointerToMinutes, pointerToRawMinutes, shortDayLabel, snapMinutes, weekdayOf } from './timeMath';

export type SchedulerView = 'week' | 'day' | 'resource';

export type SchedulerCrew = { id: string; name: string };

export type SchedulerCalendarProps = {
  /** What the calendar shows, for the accessible name: "Maintenance week 11". */
  label: string;
  /** Starting items. The calendar owns the list after that. */
  events: readonly SchedEvent[];
  /** The days of the week, as ISO dates, in order. */
  days: readonly string[];
  crews: readonly SchedulerCrew[];
  rules: ConflictRules;
  /** Starting view. */
  view?: SchedulerView;
  /** Lets the user switch between the three views. */
  showViewSwitch?: boolean;
  /** The day shown in the day and resource views at the start. */
  focusDay?: string;
  /** Crew a new job gets in the day and week views. */
  defaultCrewId: string;
  /** Draws the "now" line. */
  now?: { dayId: string; minute: number };
  /** Hours of the day shown, 0–24. */
  startHour?: number;
  endHour?: number;
  /** Hours shaded as outside working time in the day and week views. */
  workHours?: { start: number; end: number };
  /** Days of the week (0 is Sunday) shaded all day in the week view. */
  closedWeekdays?: readonly number[];
  /** No dragging, creating, deleting or undo; items can still be selected and read. */
  readOnly?: boolean;
  /** Shows placeholder columns instead of items. */
  loading?: boolean;
  /** Height of one hour in spacing units. */
  hourUnits?: number;
  /** Starts with this item selected and its details open. */
  initialOpenId?: string;
  /** Starts with the quick-create form open for this range. */
  initialDraft?: Draft;
  onEventsChange?: (events: readonly SchedEvent[]) => void;
  /** Layout classes for the frame, usually a height. */
  className?: string;
};

type Preview = { mode: 'create' | 'move' | 'resize'; eventId?: string; colIndex: number; start: number; end: number; placement: Placement };

type DragRef = {
  mode: 'create' | 'move' | 'resize';
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  eventId?: string;
  anchor: number;
  grab: number;
  colIndex: number;
};

const DRAG_THRESHOLD = 4;
const NUDGE_KEYS: readonly string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const INSTRUCTIONS = 'Drag on empty time to create a job, drag a job to move it, drag its bottom edge to resize it. With a job focused, arrow keys move it, Shift with Up or Down resizes it, Enter opens it and Delete removes it.';

function isNudgeKey(key: string): key is NudgeKey {
  return NUDGE_KEYS.includes(key);
}

const VIEW_LABELS: Record<SchedulerView, string> = { week: 'Week', day: 'Day', resource: 'By crew' };

function toView(value: unknown): SchedulerView {
  return value === 'day' || value === 'resource' ? value : 'week';
}

/**
 * A working week or day calendar. Drag on empty time to create a job (snaps to 15 minutes, with a
 * ghost and a quick-create form), drag a job to move it between days or crews, drag its bottom
 * edge to resize it. Overlapping jobs share a column in lanes, a double-booked crew or a job outside
 * working hours is marked with its reason, and every action works from the keyboard and is
 * announced. State is `schedulerReducer`; the maths is in `geometry` and `timeMath`.
 */
export function SchedulerCalendar(props: SchedulerCalendarProps) {
  const {
    label,
    days,
    crews,
    rules,
    showViewSwitch = true,
    defaultCrewId,
    now,
    startHour = 6,
    endHour = 20,
    workHours = { start: 7, end: 16 },
    closedWeekdays = [0, 6],
    readOnly = false,
    loading = false,
    hourUnits = 12,
    onEventsChange,
    className,
  } = props;
  const [view, setView] = useState<SchedulerView>(props.view ?? 'week');
  const [focusDay, setFocusDay] = useState(props.focusDay ?? days[0]);
  const [state, dispatch] = useReducer(schedulerReducer, props, (initial) => {
    const created = createSchedulerState(initial.events);
    const withDraft = initial.initialDraft ? schedulerReducer(created, { type: 'setDraft', draft: initial.initialDraft }) : created;
    return initial.initialOpenId ? schedulerReducer(withDraft, { type: 'open', id: initial.initialOpenId }) : withDraft;
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const helpId = useId();
  const columnsRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragRef | null>(null);
  const justDragged = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  const firstRender = useRef(true);

  const window = useMemo(() => ({ start: startHour * 60, end: endHour * 60 }), [startHour, endHour]);
  const hours = Math.max(1, endHour - startHour);
  const crewName = (id: string): string => crews.find((crew) => crew.id === id)?.name ?? id;
  const tone = (resourceId: string): string => CREW_TONES[Math.max(0, crews.findIndex((crew) => crew.id === resourceId)) % CREW_TONES.length];

  const columns = useMemo<SchedColumn[]>(() => {
    if (view === 'week') return days.map((dayId) => ({ id: dayId, label: shortDayLabel(dayId), dayId }));
    if (view === 'day') return [{ id: focusDay, label: longDayLabel(focusDay), dayId: focusDay }];
    return crews.map((crew) => ({ id: crew.id, label: crew.name, dayId: focusDay, resourceId: crew.id }));
  }, [view, days, crews, focusDay]);

  const conflicts = useMemo(() => findConflicts(state.events, rules), [state.events, rules]);
  const selected = state.events.find((event) => event.id === state.selectedId) ?? null;
  const percent = (fraction: number) => `${Math.round(fraction * 10000) / 100}%`;
  const ticks = Array.from({ length: hours + 1 }, (_, index) => index);
  const template = { gridTemplateColumns: `3rem repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))` };
  const joined = (list: readonly Conflict[] | undefined): string | null => (list && list.length > 0 ? list.map((conflict) => conflict.message).join('. ') : null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onEventsChange?.(state.events);
  }, [state.events, onEventsChange]);

  useEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    pendingFocus.current = null;
    columnsRef.current?.querySelector<HTMLElement>(`[data-sched-event="${CSS.escape(id)}"]`)?.focus();
  }, [state.events]);

  const dragging = preview !== null;
  useEffect(() => {
    if (!dragging) return undefined;
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      drag.current = null;
      setPreview(null);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [dragging]);

  const eventById = (id: string | undefined): SchedEvent | undefined => (id === undefined ? undefined : state.events.find((event) => event.id === id));

  const bodyBox = () => {
    const box = columnsRef.current?.getBoundingClientRect();
    return { top: box?.top ?? 0, height: box?.height ?? 0 };
  };
  const columnBounds = () => [...(columnsRef.current?.querySelectorAll<HTMLElement>('[data-sched-col]') ?? [])].map((element) => element.getBoundingClientRect());

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || readOnly || loading) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest('[data-sched-popover]')) return;
    justDragged.current = false;
    const body = bodyBox();
    const raw = pointerToRawMinutes(event.clientY, body, window);
    const handle = target.closest<HTMLElement>('[data-sched-resize]');
    const block = target.closest<HTMLElement>('[data-sched-event]');
    const columnElement = target.closest<HTMLElement>('[data-sched-col]');
    const base = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    if (handle) {
      const item = eventById(handle.dataset.schedResize);
      if (!item) return;
      drag.current = { ...base, mode: 'resize', eventId: item.id, anchor: item.end, grab: 0, colIndex: columnOf(item, columns) };
    } else if (block) {
      const item = eventById(block.dataset.schedEvent);
      if (!item) return;
      drag.current = { ...base, mode: 'move', eventId: item.id, anchor: item.start, grab: raw - item.start, colIndex: columnOf(item, columns) };
    } else if (columnElement) {
      const colIndex = Number(columnElement.dataset.schedCol);
      if (!Number.isInteger(colIndex)) return;
      drag.current = { ...base, mode: 'create', anchor: pointerToMinutes(event.clientY, body, window, 'floor'), grab: 0, colIndex };
    } else {
      return;
    }
    columnsRef.current?.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < DRAG_THRESHOLD) return;
    current.moved = true;
    const body = bodyBox();
    const colIndex = columnIndexAt(event.clientX, columnBounds());
    const item = eventById(current.eventId);
    if (current.mode === 'create') {
      const column = columns[current.colIndex];
      if (!column) return;
      const range = draftFromDrag(current.anchor, pointerToMinutes(event.clientY, body, window), window);
      setPreview({ mode: 'create', colIndex: current.colIndex, ...range, placement: { dayId: column.dayId, resourceId: column.resourceId ?? defaultCrewId, ...range } });
    } else if (item && current.mode === 'move') {
      const column = columns[colIndex];
      if (!column) return;
      const placement = movedTo(item, column, snapMinutes(pointerToRawMinutes(event.clientY, body, window) - current.grab), window);
      setPreview({ mode: 'move', eventId: item.id, colIndex, start: placement.start, end: placement.end, placement });
    } else if (item) {
      const placement = resizedTo(item, pointerToMinutes(event.clientY, body, window), window);
      setPreview({ mode: 'resize', eventId: item.id, colIndex: current.colIndex, start: placement.start, end: placement.end, placement });
    }
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    columnsRef.current?.releasePointerCapture?.(event.pointerId);
    const shown = preview;
    setPreview(null);
    if (current.moved) justDragged.current = true;
    if (cancelled) return;
    if (current.mode === 'create') {
      const column = columns[current.colIndex];
      if (!column) return;
      const range = current.moved && shown ? { start: shown.start, end: shown.end } : draftFromDrag(current.anchor, current.anchor + 60, window);
      dispatch({ type: 'setDraft', draft: { dayId: column.dayId, resourceId: column.resourceId ?? defaultCrewId, ...range } });
    } else if (current.moved && shown?.eventId) {
      pendingFocus.current = shown.eventId;
      dispatch({ type: 'place', id: shown.eventId, placement: shown.placement });
    }
  };

  const cancelDrag = () => {
    if (!drag.current) return false;
    drag.current = null;
    setPreview(null);
    return true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (cancelDrag()) {
        event.preventDefault();
      } else if (state.draft) {
        dispatch({ type: 'setDraft', draft: null });
      } else if (state.detailOpen) {
        dispatch({ type: 'closeDetail' });
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !readOnly) {
      event.preventDefault();
      dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
    }
  };

  const onEventKeyDown = (item: SchedEvent) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch({ type: 'open', id: item.id });
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && !readOnly) {
      event.preventDefault();
      dispatch({ type: 'remove', id: item.id });
    } else if (isNudgeKey(event.key) && !readOnly && !item.allDay) {
      event.preventDefault();
      const next = nudge(item, event.key, event.shiftKey, columns, window);
      if (next) {
        pendingFocus.current = item.id;
        dispatch({ type: 'place', id: item.id, placement: next });
      }
    }
  };

  const activate = (item: SchedEvent) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    dispatch({ type: 'open', id: item.id });
  };

  const formDays = days.map((dayId) => ({ value: dayId, label: longDayLabel(dayId) }));
  const formCrews = crews.map((crew) => ({ value: crew.id, label: crew.name }));
  const conflictsForValues = (values: EventFormValues): readonly Conflict[] => conflictsOf({ ...values, kind: 'job' }, state.events, rules);
  const createFrom = (values: EventFormValues) => dispatch({ type: 'create', event: { ...values, kind: 'job' } });
  const dayIndex = days.indexOf(focusDay);
  const stepDay = (step: number) => setFocusDay(days[Math.min(days.length - 1, Math.max(0, dayIndex + step))] ?? focusDay);
  const previewBase = preview ? eventById(preview.eventId) : undefined;
  const previewConflict = preview ? joined(conflictsOf({ title: previewBase?.title ?? 'New job', kind: previewBase?.kind ?? 'job', ...preview.placement, id: preview.eventId }, state.events, rules)) : null;
  const previewText = preview ? `${preview.mode === 'create' ? 'New job' : preview.mode === 'move' ? 'Move to' : 'Resize to'} ${formatSpan(preview.start, preview.end)}, ${longDayLabel(preview.placement.dayId)}` : null;

  const allDay = state.events.filter((event) => event.allDay);
  const draftColumn = state.draft ? columns.findIndex((column) => column.dayId === state.draft?.dayId && (column.resourceId === undefined || column.resourceId === state.draft?.resourceId)) : -1;

  return (
    <div data-slot="scheduler" role="group" aria-label={label} aria-describedby={helpId} onKeyDown={onKeyDown} className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-default bg-base-background', className)}>
      <div data-slot="scheduler-toolbar" className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-default px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {view === 'week' ? (
            <p className="text-sm font-medium text-base-foreground">{`${longDayLabel(days[0])} – ${longDayLabel(days[days.length - 1])}`}</p>
          ) : (
            <>
              <IconAction label="Previous day" disabled={dayIndex <= 0} onClick={() => stepDay(-1)}>
                <IconChevronLeft />
              </IconAction>
              <p className="min-w-36 text-sm font-medium text-base-foreground">{longDayLabel(focusDay)}</p>
              <IconAction label="Next day" disabled={dayIndex === -1 || dayIndex >= days.length - 1} onClick={() => stepDay(1)}>
                <IconChevronRight />
              </IconAction>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showViewSwitch ? (
            <SegmentedControl value={view} onValueChange={(value) => setView(toView(value))}>
              <SegmentedControlList aria-label="Calendar view" size="small">
                {(['week', 'day', 'resource'] as const).map((option) => (
                  <SegmentedControlButton key={option} value={option} tabContent="label-only" size="small">
                    {VIEW_LABELS[option]}
                  </SegmentedControlButton>
                ))}
              </SegmentedControlList>
            </SegmentedControl>
          ) : null}
          {readOnly ? null : (
            <>
              <IconAction label="Undo" disabled={state.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>
                <IconArrowBackUp />
              </IconAction>
              <IconAction label="Redo" disabled={state.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>
                <IconArrowForwardUp />
              </IconAction>
              <Popover open={newOpen} onOpenChange={setNewOpen}>
                <PopoverTrigger
                  render={
                    <Button size="sm">
                      <IconPlus /> New job
                    </Button>
                  }
                />
                <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
                  <EventForm
                    initial={{ title: '', dayId: view === 'week' ? days[0] : focusDay, resourceId: defaultCrewId, start: 9 * 60, end: 10 * 60 }}
                    days={formDays}
                    crews={formCrews}
                    conflictsFor={conflictsForValues}
                    autoFocus
                    onSubmit={(values) => {
                      createFrom(values);
                      setNewOpen(false);
                    }}
                    onCancel={() => setNewOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1">
        <div data-slot="scheduler-scroll" className="relative min-h-0 min-w-0 flex-1 overflow-auto">
          <div className="sticky top-0 z-20 bg-base-background">
            <div className="grid border-b border-default" style={template}>
              <span />
              {columns.map((column) => {
                const today = now !== undefined && now.dayId === column.dayId;
                return (
                  <span key={column.id} aria-current={today && view !== 'resource' ? 'date' : undefined} className={cn('truncate px-2 py-1.5 text-xs tabular-nums', today && view !== 'resource' ? 'font-semibold text-base-foreground' : 'text-muted-foreground')}>
                    {column.label}
                    {today && view === 'week' ? <span className="font-normal text-muted-foreground"> · Today</span> : null}
                  </span>
                );
              })}
            </div>
            {allDay.length > 0 || view !== 'resource' ? (
              <div data-slot="scheduler-all-day" className="grid border-b border-default" style={template}>
                <span className="px-2 py-1.5 text-right text-xs text-muted-foreground">All day</span>
                {columns.map((column) => (
                  <ul key={column.id} aria-label={`All day, ${column.label}`} className="flex min-h-8 flex-col gap-0.5 border-l border-default p-0.5">
                    {allDay
                      .filter((item) => item.dayId === column.dayId && (column.resourceId === undefined || column.resourceId === item.resourceId))
                      .map((item) => (
                        <li key={item.id} className="flex">
                          <EventBlock inline resizable={false} event={item} tone={tone(item.resourceId)} crewName={crewName(item.resourceId)} selected={state.selectedId === item.id} lines={2} compact onActivate={() => activate(item)} onKeyDown={onEventKeyDown(item)} />
                        </li>
                      ))}
                  </ul>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid" style={template}>
            <div aria-hidden="true" className="relative" style={{ height: `calc(var(--spacing) * ${hourUnits * hours})` }}>
              {ticks.map((tick) => (
                <span key={tick} className={cn('absolute right-2 text-xs tabular-nums text-muted-foreground', tick === 0 ? 'top-0' : '-translate-y-1/2')} style={tick === 0 ? undefined : { top: percent(tick / hours) }}>
                  {formatClock((startHour + tick) * 60)}
                </span>
              ))}
            </div>
            <div ref={columnsRef} data-slot="scheduler-columns" className="relative grid touch-none" style={{ gridColumn: '2 / -1', gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(event) => finishDrag(event, false)} onPointerCancel={(event) => finishDrag(event, true)}>
              {columns.map((column, colIndex) => {
                const here = state.events.filter((item) => !item.allDay && columnOf(item, [column]) === 0);
                const placements = layoutEvents(here, window);
                const hoursRule = column.resourceId === undefined ? undefined : rules.hours[column.resourceId];
                const weekday = weekdayOf(column.dayId);
                const closed = view === 'resource' ? hoursRule !== undefined && weekday !== null && !hoursRule.weekdays.includes(weekday) : weekday !== null && closedWeekdays.includes(weekday);
                const open = view === 'resource' && hoursRule ? { start: hoursRule.start, end: hoursRule.end } : { start: workHours.start * 60, end: workHours.end * 60 };
                const span = window.end - window.start;
                const showNow = now !== undefined && now.dayId === column.dayId && now.minute >= window.start && now.minute <= window.end;
                const ghostHere = preview !== null && preview.colIndex === colIndex;
                const ghostEvent: SchedEvent | null = preview && ghostHere ? { id: 'ghost', title: previewBase?.title ?? 'New job', kind: previewBase?.kind ?? 'job', reference: previewBase?.reference, ...preview.placement } : null;
                const ghostLines = preview ? Math.max(1, Math.floor((((preview.end - preview.start) / 60) * hourUnits * 4 - 6) / 16)) : 1;
                return (
                  <div key={column.id} role="group" aria-label={column.label} data-sched-col={colIndex} className="relative border-l border-default">
                    {loading ? <Skeleton className="absolute inset-x-1 top-8 h-24" /> : null}
                    {closed ? (
                      <div aria-hidden="true" data-slot="scheduler-closed" className="absolute inset-0 bg-muted-background" />
                    ) : (
                      <>
                        <div aria-hidden="true" data-slot="scheduler-closed" className="absolute inset-x-0 top-0 bg-muted-background" style={{ height: percent(Math.max(0, Math.min(1, (open.start - window.start) / span))) }} />
                        <div aria-hidden="true" data-slot="scheduler-closed" className="absolute inset-x-0 bottom-0 bg-muted-background" style={{ height: percent(Math.max(0, Math.min(1, (window.end - open.end) / span))) }} />
                      </>
                    )}
                    {ticks.map((tick) => (
                      <div key={tick} aria-hidden="true" className="absolute inset-x-0 border-t border-default" style={{ top: percent(tick / hours) }} />
                    ))}
                    {loading
                      ? null
                      : placements.map((placement) => {
                          const item = here.find((candidate) => candidate.id === placement.id);
                          if (!item) return null;
                          const lines = Math.max(1, Math.floor((((item.end - item.start) / 60) * hourUnits * 4 - 6) / 16));
                          return (
                            <EventBlock
                              key={item.id}
                              event={item}
                              tone={tone(item.resourceId)}
                              crewName={crewName(item.resourceId)}
                              selected={state.selectedId === item.id}
                              conflict={joined(conflicts[item.id])}
                              dragging={preview?.eventId === item.id}
                              lines={lines}
                              compact={placement.lanes > 1 && columns.length > 3}
                              resizable={!readOnly}
                              onActivate={() => activate(item)}
                              onKeyDown={onEventKeyDown(item)}
                              style={{ top: percent(placement.top), height: percent(placement.height), left: percent(placement.lane / placement.lanes), width: percent(1 / placement.lanes) }}
                            />
                          );
                        })}
                    {ghostEvent && preview ? (
                      <EventBlock ghost event={ghostEvent} tone={tone(ghostEvent.resourceId)} conflict={previewConflict} lines={ghostLines} style={{ top: percent((preview.start - window.start) / span), height: percent((preview.end - preview.start) / span), left: 0, width: '100%' }} />
                    ) : null}
                    {state.draft && draftColumn === colIndex ? (
                      <>
                        <EventBlock ghost event={{ id: 'draft', title: 'New job', kind: 'job', ...state.draft }} tone={tone(state.draft.resourceId)} lines={2} style={{ top: percent((state.draft.start - window.start) / span), height: percent((state.draft.end - state.draft.start) / span), left: 0, width: '100%' }} />
                        <div
                          role="dialog"
                          aria-label="New job"
                          data-sched-popover=""
                          className={cn('absolute z-30 w-72 rounded-xl border border-default bg-popover-background p-4 text-popover-foreground shadow-md', colIndex >= columns.length / 2 ? 'right-full mr-1' : 'left-full ml-1')}
                          style={(state.draft.start - window.start) / span > 0.4 ? { bottom: percent(1 - (state.draft.end - window.start) / span) } : { top: percent((state.draft.start - window.start) / span) }}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          <EventForm
                            initial={{ title: '', ...state.draft }}
                            days={formDays}
                            crews={formCrews}
                            conflictsFor={conflictsForValues}
                            autoFocus
                            onSubmit={createFrom}
                            onCancel={() => dispatch({ type: 'setDraft', draft: null })}
                          />
                        </div>
                      </>
                    ) : null}
                    {showNow ? (
                      <div data-slot="scheduler-now" className="pointer-events-none absolute inset-x-0 z-10 flex -translate-y-1/2 items-center" style={{ top: percent((now.minute - window.start) / span) }}>
                        <span aria-hidden="true" className="-ml-1 size-2 shrink-0 rounded-full bg-base-foreground" />
                        <span aria-hidden="true" className="h-px flex-1 bg-base-foreground" />
                        <span className="sr-only">Now, {formatClock(now.minute)}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {state.detailOpen && selected ? (
          <aside className="w-72 shrink-0 border-l border-default">
            <EventDetailPanel event={selected} crewName={crewName(selected.resourceId)} conflicts={conflicts[selected.id] ?? []} onDelete={readOnly ? undefined : () => dispatch({ type: 'remove', id: selected.id })} onClose={() => dispatch({ type: 'closeDetail' })} />
          </aside>
        ) : null}
      </div>

      <div data-slot="scheduler-status" className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-default bg-muted-background px-3 py-1.5 text-xs text-muted-foreground">
        {previewText ? (
          <span className={cn('tabular-nums', previewConflict ? 'text-warning-foreground-strong' : 'text-base-foreground')}>
            {previewText}
            {previewConflict ? ` · ${previewConflict}` : ''}
          </span>
        ) : (
          <span id={helpId}>{readOnly ? 'Read-only. Select a job to see its details.' : 'Drag on empty time to create, drag a job to move it, drag its bottom edge to resize. Arrows move a focused job; Shift with Up or Down resizes it.'}</span>
        )}
      </div>
      <p className="sr-only">{INSTRUCTIONS}</p>
      <div aria-live="polite" className="sr-only" data-slot="scheduler-announcer">
        {state.announcement}
      </div>
    </div>
  );
}
