import { IconAlertOctagon, IconAlertTriangle } from '@cognite/aura/icons';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { formatValue } from '../../industrial/status';
import type { Tone } from '../../industrial/status';

import { currentNode, drillKeyAction } from './drillReducer';
import type { DrillAction, DrillState } from './drillReducer';
import { LEVEL_LABEL, childSummary, isAbnormal } from './hierarchy';
import type { DrillMetric, DrillNode, DrillTree } from './hierarchy';
import type { TreemapBounds } from './treemapLayout';
import { TREEMAP_FULL, layoutChildren, zoomOrigin } from './treemapZoom';
import { prefersReducedMotion } from './useTween';

export type TreemapCanvasProps = {
  tree: DrillTree;
  state: DrillState;
  dispatch: (action: DrillAction) => void;
  /** The roll-up figure rectangles are sized by. */
  metric: DrillMetric;
  /** Accessible name of the treemap. */
  label: string;
  /** What fills the canvas when the journey reaches a node without children: the sensor's trend. */
  renderLeaf?: (node: DrillNode) => ReactNode;
  /** Smallest share of the canvas a rectangle gets, so zero values stay clickable. */
  minShare?: number;
  /** `false` swaps levels without the zoom. */
  animate?: boolean;
  className?: string;
};

const TILE_TONE: Record<Tone, string> = {
  neutral: 'bg-card-background text-base-foreground border-default hover:bg-card-background-hover',
  success: 'bg-card-background text-base-foreground border-default hover:bg-card-background-hover',
  info: 'bg-card-background text-base-foreground border-default hover:bg-card-background-hover',
  warning: 'bg-warning-background text-warning-foreground border-transparent hover:bg-warning-background-hover',
  critical: 'bg-critical-background text-critical-foreground border-transparent hover:bg-critical-background-hover',
};

const percent = (value: number): string => `${Math.round(value * 1000) / 1000}%`;

type Shown = { key: string; path: readonly string[]; metricKey: string; from: TreemapBounds | null; phase: 'start' | 'run' };

function StateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon aria-hidden="true" className="size-4 shrink-0" />;
  if (tone === 'warning') return <IconAlertTriangle aria-hidden="true" className="size-4 shrink-0" />;
  return null;
}

/**
 * A zoomable treemap of the hierarchy: the children of the current node as rectangles sized by
 * a metric and toned by state — neutral unless abnormal, and then with an icon and a label, never
 * colour alone. Clicking a rectangle zooms it until it fills the canvas and shows what is inside;
 * at the bottom of the tree the canvas hands over to `renderLeaf`.
 *
 * Keyboard: arrows move between rectangles, Enter goes in, Escape or Backspace goes up.
 */
export function TreemapCanvas({ tree, state, dispatch, metric, label, renderLeaf, minShare = 0.06, animate = true, className }: TreemapCanvasProps) {
  const baseId = useId().replace(/:/g, '');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 960, height: 480 });
  const pathKey = state.path.join('/');
  const [shown, setShown] = useState<Shown>({ key: pathKey, path: state.path, metricKey: metric.key, from: null, phase: 'run' });

  // A new path: work out where the zoom starts before the new level is first painted.
  if (shown.key !== pathKey) {
    const from = animate && !prefersReducedMotion() ? zoomOrigin(tree, shown.path, state.path, shown.metricKey, minShare) : null;
    setShown({ key: pathKey, path: state.path, metricKey: metric.key, from, phase: from ? 'start' : 'run' });
  } else if (shown.metricKey !== metric.key) {
    setShown({ ...shown, metricKey: metric.key });
  }

  useEffect(() => {
    if (shown.phase !== 'start') return undefined;
    // Two frames: one to paint the starting frame, one to start the transition from it.
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setShown((value) => (value.phase === 'start' ? { ...value, phase: 'run' } : value)));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [shown.phase, shown.key]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(() => {
      const box = element.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) setSize({ width: box.width, height: box.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const current = currentNode(tree, state);
  const rects = layoutChildren(current, metric.key, minShare);
  const starting = shown.phase === 'start' && shown.from !== null;
  const frame = starting && shown.from ? shown.from : TREEMAP_FULL;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = drillKeyAction(event.key, state);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    dispatch(action);
  };

  return (
    <div
      ref={canvasRef}
      data-slot="treemap-canvas"
      data-level={current.level}
      data-phase={shown.phase}
      role="group"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={state.focusId ? `${baseId}-${state.focusId}` : undefined}
      onKeyDown={onKeyDown}
      onMouseLeave={() => dispatch({ type: 'hover', id: null })}
      className={cn('group/treemap relative size-full overflow-hidden outline-none', className)}
    >
      <div
        key={shown.key}
        data-slot="treemap-frame"
        className={cn('absolute', starting ? 'opacity-60' : 'opacity-100 motion-safe:transition-[left,top,width,height,opacity] motion-safe:duration-500 motion-safe:ease-in-out')}
        style={{ left: percent(frame.x), top: percent(frame.y), width: percent(frame.width), height: percent(frame.height) }}
      >
        {current.children.length === 0 ? (
          <div data-slot="treemap-leaf" className="absolute inset-0 p-0.5">
            {renderLeaf ? (
              renderLeaf(current)
            ) : (
              <div className="flex size-full items-center justify-center rounded-md border border-default bg-card-background text-sm text-muted-foreground">
                {current.name}: nothing below this {LEVEL_LABEL[current.level].toLowerCase()}
              </div>
            )}
          </div>
        ) : (
          rects.map((rect) => {
            const node = tree.byId.get(rect.id);
            if (!node) return null;
            const pixelWidth = (rect.width / 100) * size.width;
            const pixelHeight = (rect.height / 100) * size.height;
            const roomy = pixelWidth >= 168 && pixelHeight >= 120;
            const compact = !roomy && pixelWidth >= 92 && pixelHeight >= 50;
            const abnormal = isAbnormal(node.status.tone);
            const focused = state.focusId === node.id;
            const value = formatValue(node.metrics[metric.key] ?? 0, metric.decimals ?? 0);
            // What a normal rectangle says under its name: the live reading for a sensor, else what is inside.
            const reading = node.reading;
            const quiet = reading ? `${formatValue(reading.value, reading.decimals)}${reading.value === null ? '' : ` ${reading.unit}`}` : childSummary(node);
            return (
              <div
                key={node.id}
                data-slot="treemap-tile"
                className="absolute p-0.5 motion-safe:transition-[left,top,width,height] motion-safe:duration-500 motion-safe:ease-in-out"
                style={{ left: percent(rect.x), top: percent(rect.y), width: percent(rect.width), height: percent(rect.height) }}
              >
                <button
                  type="button"
                  id={`${baseId}-${node.id}`}
                  tabIndex={-1}
                  data-tone={node.status.tone}
                  data-focused={focused ? 'true' : undefined}
                  aria-label={`${LEVEL_LABEL[node.level]} ${node.tag} ${node.name}: ${metric.label} ${value}${metric.unit ? ` ${metric.unit}` : ''}, ${node.status.label}`}
                  title={`${node.tag} ${node.name}`}
                  onClick={() => dispatch({ type: 'drill', id: node.id })}
                  onMouseEnter={() => dispatch({ type: 'hover', id: node.id })}
                  className={cn(
                    'flex size-full cursor-pointer flex-col overflow-hidden rounded-md border text-left outline-none motion-safe:transition-colors',
                    roomy ? 'justify-between gap-2 p-3' : 'justify-between gap-1 p-2',
                    TILE_TONE[node.status.tone],
                    focused ? 'group-focus-visible/treemap:ring-2 group-focus-visible/treemap:ring-inset group-focus-visible/treemap:ring-ring-default' : ''
                  )}
                >
                  {roomy ? (
                    <>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-xs opacity-80">{node.tag}</span>
                          <StateIcon tone={node.status.tone} />
                        </span>
                        <span className="line-clamp-2 text-sm font-medium leading-5">{node.name}</span>
                        <span className={cn('truncate text-xs', abnormal ? 'font-medium' : 'opacity-70')}>{abnormal ? node.status.label : quiet}</span>
                      </span>
                      <span className="flex flex-col">
                        <span className="truncate text-xs opacity-70">{metric.label}</span>
                        <span className="text-2xl font-semibold tabular-nums tracking-tight">
                          {value}
                          {metric.unit ? <span className="ml-1 text-sm font-normal opacity-70">{metric.unit}</span> : null}
                        </span>
                      </span>
                    </>
                  ) : compact ? (
                    <>
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate font-mono text-xs opacity-80">{node.tag}</span>
                        <StateIcon tone={node.status.tone} />
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {value}
                        {metric.unit ? <span className="ml-1 text-xs font-normal opacity-70">{metric.unit}</span> : null}
                      </span>
                    </>
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <StateIcon tone={node.status.tone} />
                    </span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {LEVEL_LABEL[current.level]}: {current.name}. {childSummary(current)}, sized by {metric.label.toLowerCase()}.
      </span>
    </div>
  );
}
