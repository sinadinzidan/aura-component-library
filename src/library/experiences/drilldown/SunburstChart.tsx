import { IconArrowUp } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';
import { TONE_TEXT, formatLimit, formatValue } from '../../industrial/status';
import type { Tone } from '../../industrial/status';
import { StatusDot } from '../../industrial/StatusDot';

import { currentNode, drillKeyAction } from './drillReducer';
import type { DrillAction, DrillState } from './drillReducer';
import { LEVEL_LABEL, childSummary, isAbnormal, pathTo } from './hierarchy';
import type { DrillNode, DrillReading, DrillTree } from './hierarchy';
import { arcCentroid, arcLength, arcLinePath, arcPath, fitsInArc, isLowerHalf, partition, polar, shapeArcs, tweenArcs } from './sunburstLayout';
import type { ArcShape } from './sunburstLayout';
import { SvgStatusMark } from './SvgStatusMark';
import { useTween } from './useTween';

export type SunburstChartProps = {
  tree: DrillTree;
  state: DrillState;
  dispatch: (action: DrillAction) => void;
  /** Accessible name of the chart. */
  label: string;
  /** `false` re-roots without the arc tween. */
  animate?: boolean;
  className?: string;
};

const SIZE = 400;
const CENTRE = SIZE / 2;
const DISC = 86;
const RIM = 196;
/** Share of the chart's shorter side the centre disc covers, for the HTML button over it. */
const DISC_SHARE = ((DISC - 4) * 2 * 100) / SIZE;

const GAUGE_START = (-135 * Math.PI) / 180;
const GAUGE_SWEEP = (270 * Math.PI) / 180;

/** Neutral arcs are tinted with the accent, lighter with every ring outwards. */
const RING_FILL = [
  '',
  'fill-[color-mix(in_oklab,var(--primary-background)_26%,var(--card-background))]',
  'fill-[color-mix(in_oklab,var(--primary-background)_15%,var(--card-background))]',
  'fill-[color-mix(in_oklab,var(--primary-background)_8%,var(--card-background))]',
];

const TONE_FILL: Partial<Record<Tone, string>> = {
  warning: 'fill-warning-background',
  critical: 'fill-critical-background',
};

const ZONE_FILL: Record<'band' | 'warning' | 'critical', string> = {
  band: 'fill-chart-neutral-300',
  warning: 'fill-chart-warning-400',
  critical: 'fill-chart-critical-400',
};

function gaugeAngle(value: number, reading: Pick<DrillReading, 'rangeMin' | 'rangeMax'>): number {
  const span = reading.rangeMax - reading.rangeMin;
  const fraction = span <= 0 ? 0 : Math.min(1, Math.max(0, (value - reading.rangeMin) / span));
  return GAUGE_START + fraction * GAUGE_SWEEP;
}

/**
 * A sunburst of the hierarchy: the current node in the centre, a ring for each level below it.
 * Hovering an arc lights up the path from the centre to it; clicking one re-roots the chart on
 * it, with the arcs sweeping into their new places. The centre disc names the current node with
 * its state and headline figure and is the way up. On a sensor the rings give way to a gauge of
 * the value on its range.
 *
 * Abnormal arcs carry a shape mark as well as a tint. Pair the chart with a list of the same
 * nodes so it also works without a pointer and without reading the rings.
 */
export function SunburstChart({ tree, state, dispatch, label, animate = true, className }: SunburstChartProps) {
  const baseId = useId().replace(/:/g, '');
  const [hasFocus, setHasFocus] = useState(false);
  const root = currentNode(tree, state);
  const parent = root.parentId === null ? undefined : tree.byId.get(root.parentId);
  const target = shapeArcs(
    partition(root, { id: (node: DrillNode) => node.id, children: (node: DrillNode) => node.children }),
    { inner: DISC, outer: RIM, gap: 2.5 }
  );
  const { value: shapes, settled } = useTween<readonly ArcShape[]>(target, tweenArcs, { key: root.id, animate, durationMs: 550 });

  const lit = new Set(state.hoverId ? pathTo(tree, state.hoverId).map((node) => node.id) : []);
  const reading = root.level === 'sensor' ? root.reading : undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = drillKeyAction(event.key, state);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    dispatch(action);
  };

  return (
    <div
      data-slot="sunburst-chart"
      data-level={root.level}
      data-settled={settled ? 'true' : 'false'}
      role="group"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={state.focusId ? `${baseId}-${state.focusId}` : undefined}
      onKeyDown={onKeyDown}
      onFocus={(event) => setHasFocus(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setHasFocus(false)}
      onMouseLeave={() => dispatch({ type: 'hover', id: null })}
      className={cn('relative size-full rounded-lg outline-none [container-type:size] focus-visible:ring-2 focus-visible:ring-ring-default', className)}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="xMidYMid meet" className="block size-full select-none">
        {shapes.map((shape) => {
          const node = tree.byId.get(shape.id);
          if (!node) return null;
          const dimmed = state.hoverId !== null && !lit.has(node.id);
          const focused = hasFocus && state.focusId === node.id;
          return (
            <path
              key={shape.id}
              id={`${baseId}-${node.id}`}
              data-slot="sunburst-arc"
              data-tone={node.status.tone}
              role="button"
              aria-label={`${LEVEL_LABEL[node.level]} ${node.tag} ${node.name}: ${node.status.label}`}
              d={arcPath(CENTRE, CENTRE, shape.r0, shape.r1, shape.start, shape.end)}
              opacity={dimmed ? 0.35 : 1}
              strokeWidth={focused || lit.has(node.id) ? 2.5 : 1.5}
              onClick={() => dispatch({ type: 'jump', id: node.id })}
              onMouseEnter={() => dispatch({ type: 'hover', id: node.id })}
              className={cn(
                'cursor-pointer outline-none motion-safe:transition-opacity',
                TONE_FILL[node.status.tone] ?? RING_FILL[Math.min(shape.depth, RING_FILL.length - 1)],
                focused ? 'stroke-ring-default' : lit.has(node.id) ? 'stroke-primary-background' : 'stroke-base-background'
              )}
            >
              <title>{`${node.tag} ${node.name}: ${node.status.label}`}</title>
            </path>
          );
        })}

        {/* Labels follow their arc, sit above every segment, and are only printed where they fit. */}
        {settled
          ? shapes.map((shape) => {
              const node = tree.byId.get(shape.id);
              if (!node) return null;
              const abnormal = isAbnormal(node.status.tone);
              const dimmed = state.hoverId !== null && !lit.has(node.id);
              const thickness = shape.r1 - shape.r0;
              const room = arcLength(shape) - 14;
              const tag = abnormal ? `${node.status.tone === 'critical' ? '◆' : '■'} ${node.tag}` : node.tag;
              const figure = `${formatValue(node.figure.value, node.figure.decimals)}${node.figure.unit && node.figure.value !== null ? ` ${node.figure.unit}` : ''}`;
              const showTag = thickness >= 18 && room >= tag.length * 6.5;
              const showName = showTag && thickness >= 46 && room >= node.name.length * 6.6;
              const showFigure = showName && thickness >= 66 && room >= figure.length * 6.6;
              if (!showTag) {
                const centroid = arcCentroid(CENTRE, CENTRE, shape);
                return abnormal && fitsInArc(shape, 11, 11) ? (
                  <SvgStatusMark key={shape.id} x={centroid.x} y={centroid.y} size={9} tone={node.status.tone} shape={node.status.shape} className={cn('pointer-events-none', dimmed ? 'opacity-40' : '')} />
                ) : null;
              }
              const texts = [
                { key: 'tag', value: tag, size: 10.5, className: cn('fill-current font-mono', abnormal ? TONE_TEXT[node.status.tone] : 'text-medium-foreground') },
                ...(showName ? [{ key: 'name', value: node.name, size: 12, className: 'fill-base-foreground font-medium' }] : []),
                ...(showFigure ? [{ key: 'figure', value: figure, size: 11.5, className: 'fill-medium-foreground tabular-nums' }] : []),
              ];
              // Lines stack from the top of the screen down: outwards-in above the centre, inwards-out below it.
              const direction = isLowerHalf(shape.start, shape.end) ? 1 : -1;
              const middle = (shape.r0 + shape.r1) / 2;
              return (
                <g key={shape.id} data-slot="sunburst-label" opacity={dimmed ? 0.4 : 1} className="pointer-events-none">
                  {texts.map((text, index) => {
                    const radius = middle + direction * (index - (texts.length - 1) / 2) * 17;
                    const pathId = `${baseId}-label-${node.id}-${text.key}`;
                    return (
                      <g key={text.key}>
                        <path id={pathId} d={arcLinePath(CENTRE, CENTRE, radius, shape.start, shape.end)} fill="none" />
                        <text fontSize={text.size} dominantBaseline="central" className={text.className}>
                          <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                            {text.value}
                          </textPath>
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })
          : null}

        {reading && settled ? (
          <g data-slot="sunburst-gauge" aria-hidden="true">
            <path d={arcPath(CENTRE, CENTRE, DISC + 16, DISC + 40, GAUGE_START, GAUGE_START + GAUGE_SWEEP)} className="fill-chart-neutral-100" />
            {reading.limits.low !== undefined && reading.limits.high !== undefined ? (
              <path d={arcPath(CENTRE, CENTRE, DISC + 16, DISC + 40, gaugeAngle(reading.limits.low, reading), gaugeAngle(reading.limits.high, reading))} className={ZONE_FILL.band} />
            ) : null}
            {reading.limits.high !== undefined ? (
              <path
                d={arcPath(CENTRE, CENTRE, DISC + 16, DISC + 40, gaugeAngle(reading.limits.high, reading), gaugeAngle(reading.limits.highHigh ?? reading.rangeMax, reading))}
                className={ZONE_FILL.warning}
                opacity={0.55}
              />
            ) : null}
            {reading.limits.highHigh !== undefined ? (
              <path
                d={arcPath(CENTRE, CENTRE, DISC + 16, DISC + 40, gaugeAngle(reading.limits.highHigh, reading), GAUGE_START + GAUGE_SWEEP)}
                className={ZONE_FILL.critical}
                opacity={0.7}
              />
            ) : null}
            {[
              { value: reading.rangeMin, text: formatLimit(reading.rangeMin, reading.decimals) },
              ...(reading.limits.low !== undefined && reading.limits.low > reading.rangeMin ? [{ value: reading.limits.low, text: `Low ${formatLimit(reading.limits.low, reading.decimals)}` }] : []),
              ...(reading.limits.high !== undefined ? [{ value: reading.limits.high, text: `High ${formatLimit(reading.limits.high, reading.decimals)}` }] : []),
              ...(reading.limits.highHigh !== undefined ? [{ value: reading.limits.highHigh, text: `Trip ${formatLimit(reading.limits.highHigh, reading.decimals)}` }] : []),
              { value: reading.rangeMax, text: formatLimit(reading.rangeMax, reading.decimals) },
            ].map((tick) => {
              const angle = gaugeAngle(tick.value, reading);
              const inner = polar(CENTRE, CENTRE, DISC + 40, angle);
              const outer = polar(CENTRE, CENTRE, DISC + 48, angle);
              const text = polar(CENTRE, CENTRE, DISC + 62, angle);
              return (
                <g key={tick.text}>
                  <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} strokeWidth={1.5} className="stroke-emphasized" />
                  <text x={text.x} y={text.y + 4} fontSize={11} textAnchor={text.x < CENTRE - 20 ? 'end' : text.x > CENTRE + 20 ? 'start' : 'middle'} className="fill-muted-foreground tabular-nums">
                    {tick.text}
                  </text>
                </g>
              );
            })}
            {reading.value !== null ? (
              <g className={cn(isAbnormal(root.status.tone) ? TONE_TEXT[root.status.tone] : 'text-base-foreground')}>
                <line
                  x1={polar(CENTRE, CENTRE, DISC + 10, gaugeAngle(reading.value, reading)).x}
                  y1={polar(CENTRE, CENTRE, DISC + 10, gaugeAngle(reading.value, reading)).y}
                  x2={polar(CENTRE, CENTRE, DISC + 46, gaugeAngle(reading.value, reading)).x}
                  y2={polar(CENTRE, CENTRE, DISC + 46, gaugeAngle(reading.value, reading)).y}
                  strokeWidth={4}
                  strokeLinecap="round"
                  stroke="currentColor"
                />
              </g>
            ) : null}
          </g>
        ) : null}

        <circle cx={CENTRE} cy={CENTRE} r={DISC - 4} strokeWidth={1.5} className="fill-card-background stroke-default" />
      </svg>

      <button
        type="button"
        data-slot="sunburst-centre"
        disabled={!parent}
        aria-label={parent ? `${LEVEL_LABEL[root.level]} ${root.name}, ${root.status.label}. Go up to ${parent.name}` : `${LEVEL_LABEL[root.level]} ${root.name}, ${root.status.label}. Top level`}
        onClick={() => dispatch({ type: 'up' })}
        style={{ width: `${DISC_SHARE}cqmin`, height: `${DISC_SHARE}cqmin` }}
        className={cn(
          'absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full px-4 text-center outline-none',
          'enabled:cursor-pointer enabled:hover:bg-card-background-hover focus-visible:ring-2 focus-visible:ring-ring-default'
        )}
      >
        <span className="text-xs text-muted-foreground">{LEVEL_LABEL[root.level]}</span>
        <span className="line-clamp-2 text-sm font-semibold leading-tight text-base-foreground">{root.name}</span>
        <span className={cn('flex items-center gap-1.5 text-xs', isAbnormal(root.status.tone) ? TONE_TEXT[root.status.tone] : 'text-medium-foreground')}>
          <StatusDot tone={root.status.tone} shape={root.status.shape} size="sm" />
          {root.status.label}
        </span>
        <span className={cn('text-xl font-semibold tabular-nums tracking-tight', isAbnormal(root.figure.tone) ? TONE_TEXT[root.figure.tone] : 'text-base-foreground')}>
          {formatValue(root.figure.value, root.figure.decimals)}
          {root.figure.unit && root.figure.value !== null ? <span className="ml-1 text-xs font-normal text-muted-foreground">{root.figure.unit}</span> : null}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {parent ? (
            <>
              <IconArrowUp aria-hidden="true" className="size-3.5" />
              Up
            </>
          ) : (
            'Top level'
          )}
        </span>
      </button>

      <span className="sr-only" aria-live="polite">
        {LEVEL_LABEL[root.level]}: {root.name}. {childSummary(root)}.
      </span>
    </div>
  );
}
