import { IconCheck } from '@cognite/aura/icons';
import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { columnHours, loadState, packRows, type LoadFigure, type LoadState, type PlanOrder } from './schedule';

export type TimelineColumn = {
  id: string;
  /** "Mon 9", "08:00". */
  label: string;
  /** A second, quieter word: "Today", "Weekend". */
  detail?: string;
  /** Columns outside normal working time are shaded. */
  quiet?: boolean;
};

export type TimelineLane = {
  id: string;
  name: string;
  /** Who or what the lane is: "3 technicians". */
  detail?: string;
  /** Planned hours against capacity; draws the load bar under the name. */
  load?: LoadFigure;
  /** Hours available per column. Cells planned above it are marked as over. */
  capacity?: readonly number[];
};

export type TimelineItem = PlanOrder & {
  title: string;
  /** Second line: the tag, the hours. */
  meta?: string;
  /** Category colour: a decorative family per order type. */
  tone: Tone;
  /** A short mark before the title, such as the priority. */
  flag?: string;
  done?: boolean;
};

type CrewTimelineProps = {
  /** What the timeline shows: "Work orders by crew, week 11". */
  label: string;
  columns: readonly TimelineColumn[];
  lanes: readonly TimelineLane[];
  items: readonly TimelineItem[];
  /** The current moment: a tinted column and a line `fraction` of the way through it. */
  now?: { column: number; fraction?: number; label: string };
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Planned hours against capacity per column; draws the load histogram under the lanes. */
  columnLoad?: readonly LoadFigure[];
  /** Name of the histogram row. */
  loadLabel?: string;
  /** Width of the lane name column in px. */
  laneWidth?: number;
  /** Height of one order bar in px. */
  barHeight?: number;
  className?: string;
};

const LOAD_TONE: Record<LoadState, Tone> = { free: 'success', tight: 'warning', over: 'critical' };
const LOAD_WORD: Record<LoadState, string> = { free: 'Room', tight: 'Tight', over: 'Over' };
const BAR_GAP = 6;
const LANE_PAD = 10;
const OVER_NOTE = 22;

function share({ planned, capacity }: LoadFigure): number {
  return capacity > 0 ? Math.round((planned / capacity) * 100) : 0;
}

/**
 * A lane timeline: crews (or people) down the side, days (or hours) across, work orders as bars
 * that stack when they overlap. Each lane carries a load bar and the foot of the chart a load
 * histogram, so a planner sees where the week is full before moving anything.
 */
export function CrewTimeline({
  label,
  columns,
  lanes,
  items,
  now,
  selectedId,
  onSelect,
  columnLoad,
  loadLabel = 'Daily load',
  laneWidth = 196,
  barHeight = 58,
  className,
}: CrewTimelineProps) {
  const look = useLook();
  const count = columns.length;
  const rows = packRows(items);
  const template: CSSProperties = { gridTemplateColumns: `${laneWidth}px minmax(0, 1fr)` };
  const cells: CSSProperties = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
  const nowLeft = now ? `${((now.column + (now.fraction ?? 0)) / count) * 100}%` : undefined;

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('flex min-h-0 min-w-0 flex-col text-sm', className)}>
      <div className="grid border-b border-(--kit-rule)" style={template}>
        <div />
        <div className="relative grid" style={cells}>
          {now && nowLeft ? (
            <span
              className="absolute bottom-0 z-10 -translate-x-1/2 translate-y-1/2 rounded-full bg-(--kit-accent) px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-(--kit-on-accent) tabular-nums"
              style={{ left: nowLeft }}
            >
              {now.label}
            </span>
          ) : null}
          {columns.map((column, index) => {
            const current = now?.column === index;
            return (
              <div
                key={column.id}
                className={cx('flex items-baseline gap-2 px-3 py-2.5', index > 0 && 'border-l border-(--kit-rule)')}
                style={current ? { background: 'color-mix(in oklab, var(--kit-accent) 9%, transparent)' } : undefined}
              >
                <span className={cx('font-semibold tabular-nums', column.quiet ? 'text-(--kit-text-3)' : 'text-(--kit-text)')}>{column.label}</span>
                {column.detail ? (
                  <span className={cx('text-xs', current ? 'font-semibold text-(--kit-text)' : 'text-(--kit-text-3)')}>{column.detail}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {lanes.map((lane) => {
        const laneItems = items.filter((item) => item.laneId === lane.id && item.start !== null);
        const depth = Math.max(1, ...laneItems.map((item) => (rows.get(item.id) ?? 0) + 1));
        const state = lane.load ? loadState(lane.load) : 'free';
        const used = lane.capacity ? columnHours(items, count, lane.id) : [];
        const excess = columns.map((_, index) => (lane.capacity ? Math.round((used[index] - lane.capacity[index]) * 10) / 10 : 0));
        const hasOver = excess.some((hours) => hours > 0);
        return (
          <div key={lane.id} className="grid flex-1 border-b border-(--kit-rule)" style={template}>
            <div className="flex flex-col justify-center gap-2 py-3 pr-4">
              <div>
                <p className="font-semibold text-(--kit-text)">{lane.name}</p>
                {lane.detail ? <p className="text-xs text-(--kit-text-3)">{lane.detail}</p> : null}
              </div>
              {lane.load ? (
                <div data-tone={LOAD_TONE[state]}>
                  <div
                    role="meter"
                    aria-label={`${lane.name} load`}
                    aria-valuemin={0}
                    aria-valuemax={lane.load.capacity}
                    aria-valuenow={lane.load.planned}
                    aria-valuetext={`${lane.load.planned} of ${lane.load.capacity} hours, ${LOAD_WORD[state].toLowerCase()}`}
                    className="h-2 overflow-hidden rounded-full bg-(--kit-track)"
                  >
                    <div className="h-full rounded-full bg-(--t-line)" style={{ width: `${Math.min(share(lane.load), 100)}%` }} />
                  </div>
                  <p className="mt-1.5 flex items-baseline justify-between gap-2 text-xs tabular-nums">
                    <span className="text-(--kit-text-2)">
                      {lane.load.planned} / {lane.load.capacity} h
                    </span>
                    <span className="font-semibold text-(--t-ink)">
                      {LOAD_WORD[state]} · {share(lane.load)} %
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
            <div className="relative" style={{ minHeight: depth * (barHeight + BAR_GAP) - BAR_GAP + LANE_PAD * 2 + (hasOver ? OVER_NOTE : 0) }}>
              <div className="absolute inset-0 grid" style={cells}>
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    data-tone={excess[index] > 0 ? 'critical' : undefined}
                    className={cx('flex items-end px-2 pb-1', index > 0 && 'border-l border-(--kit-rule)')}
                    style={
                      excess[index] > 0
                        ? { background: 'color-mix(in oklab, var(--t-line) 12%, transparent)' }
                        : now?.column === index
                          ? { background: 'color-mix(in oklab, var(--kit-accent) 6%, transparent)' }
                          : column.quiet
                            ? { background: 'color-mix(in oklab, var(--kit-text) 4%, transparent)' }
                            : undefined
                    }
                  >
                    {excess[index] > 0 ? <span className="text-xs font-semibold whitespace-nowrap text-(--t-ink) tabular-nums">{formatNumber(excess[index], excess[index] % 1 === 0 ? 0 : 1)} h over</span> : null}
                  </div>
                ))}
              </div>
              {nowLeft ? <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-(--kit-accent)" style={{ left: nowLeft }} /> : null}
              {laneItems.map((item) => {
                const selected = item.id === selectedId;
                const row = rows.get(item.id) ?? 0;
                return (
                  <div
                    key={item.id}
                    className="absolute px-1"
                    style={{
                      left: `${((item.start ?? 0) / count) * 100}%`,
                      width: `${(item.span / count) * 100}%`,
                      top: LANE_PAD + row * (barHeight + BAR_GAP),
                      height: barHeight,
                    }}
                  >
                    <button
                      type="button"
                      data-tone={item.tone}
                      aria-pressed={selected}
                      aria-label={`${item.title}${item.meta ? `, ${item.meta}` : ''}`}
                      onClick={() => onSelect?.(item.id)}
                      className={cx(
                        'flex size-full cursor-pointer flex-col justify-center rounded-(--kit-radius-sm) border-l-4 px-2 text-left transition-shadow outline-none',
                        'focus-visible:ring-2 focus-visible:ring-(--kit-text) focus-visible:ring-offset-1',
                        selected ? 'ring-2 ring-(--kit-text) ring-offset-2 ring-offset-(--kit-surface)' : 'hover:brightness-95'
                      )}
                      style={
                        selected
                          ? { background: 'var(--t-solid)', color: 'var(--t-on-solid)', borderColor: 'var(--t-solid)', boxShadow: '0 10px 18px -10px var(--t-line)' }
                          : { background: 'var(--t-soft)', color: 'var(--t-on-soft)', borderColor: 'var(--t-line)' }
                      }
                    >
                      <span className="text-[0.8125rem] leading-4 font-semibold wrap-anywhere">{item.title}</span>
                      {item.meta || item.flag || item.done ? (
                        <span className="mt-0.5 flex items-center gap-1 text-xs leading-4 whitespace-nowrap tabular-nums">
                          {item.done ? <IconCheck aria-hidden="true" className="size-3.5 shrink-0" /> : null}
                          {item.flag ? <span className="font-semibold">{item.flag}</span> : null}
                          {item.meta ? <span>{item.meta}</span> : null}
                        </span>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {columnLoad ? (
        <div className="grid" style={template}>
          <div className="flex flex-col justify-center py-3 pr-4">
            <p className="font-semibold text-(--kit-text)">{loadLabel}</p>
            <p className="text-xs text-(--kit-text-3)">Planned hours against capacity</p>
          </div>
          <div className="grid" style={cells}>
            {columnLoad.map((figure, index) => {
              const state = loadState(figure);
              const height = figure.capacity > 0 ? Math.min((figure.planned / figure.capacity) * 100, 125) / 1.25 : 0;
              return (
                <div
                  key={columns[index]?.id ?? index}
                  data-tone={LOAD_TONE[state]}
                  role="meter"
                  aria-label={`${columns[index]?.label ?? ''} load`}
                  aria-valuemin={0}
                  aria-valuemax={figure.capacity}
                  aria-valuenow={figure.planned}
                  aria-valuetext={`${formatNumber(figure.planned)} of ${figure.capacity} hours, ${LOAD_WORD[state].toLowerCase()}`}
                  className={cx('flex flex-col gap-1.5 px-3 pt-3 pb-2', index > 0 && 'border-l border-(--kit-rule)')}
                >
                  <div className="relative h-12">
                    <div className="absolute inset-x-0 bottom-0 rounded-t-sm bg-(--kit-track)" style={{ height: '80%' }} />
                    <div className="absolute inset-x-0 bottom-0 rounded-t-sm bg-(--t-line)" style={{ height: `${height}%` }} />
                    <div className="absolute inset-x-0 border-t border-dashed border-(--kit-text-2)" style={{ bottom: '80%' }} />
                  </div>
                  <p className="flex items-baseline justify-between gap-1 text-xs tabular-nums">
                    <span className="text-(--kit-text-2)">
                      {formatNumber(figure.planned)} / {figure.capacity} h
                    </span>
                    <span className="font-semibold text-(--t-ink)">{LOAD_WORD[state]}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
