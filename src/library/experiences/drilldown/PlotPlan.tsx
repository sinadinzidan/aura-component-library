import { useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { EquipmentSymbol } from '../../industrial/diagrams/EquipmentSymbol';
import type { SymbolKind } from '../../industrial/diagrams/symbolPaths';
import { TONE_TEXT, formatValue } from '../../industrial/status';
import type { Tone } from '../../industrial/status';

import { currentNode, drillKeyAction } from './drillReducer';
import type { DrillAction, DrillState } from './drillReducer';
import { LEVEL_LABEL, OPEN_ALARMS_METRIC, childSummary, descendantsAt, isAbnormal } from './hierarchy';
import type { DrillNode, DrillTree } from './hierarchy';
import { between, levelScales, linkSegment, mixViewport, project, projectRect, reveal, viewportFor, viewportScale } from './planLayout';
import type { PlanLayout, PlanRect } from './planLayout';
import { SvgStatusMark } from './SvgStatusMark';
import { useTween } from './useTween';

export type PlotPlanLink = { from: string; to: string; dashed?: boolean };

export type PlotPlanProps = {
  tree: DrillTree;
  /** From `layoutPlan(tree)`. */
  layout: PlanLayout;
  state: DrillState;
  dispatch: (action: DrillAction) => void;
  /** Process links between areas, drawn as arrows between their blocks. */
  links?: readonly PlotPlanLink[];
  /** Symbol per equipment kind (`node.kind`). Unknown kinds draw a vessel. */
  symbols?: Readonly<Record<string, SymbolKind>>;
  /** Accessible name of the plan. */
  label: string;
  /** `false` jumps between levels instead of zooming. */
  animate?: boolean;
  /** The card shown beside a selected measurement point. */
  sensorCard?: (node: DrillNode) => ReactNode;
  /** Overlays that sit on the plan: a mini-map, an up button. */
  children?: ReactNode;
  className?: string;
};

const BLOCK_STROKE: Record<Tone, string> = {
  neutral: 'stroke-default',
  success: 'stroke-default',
  info: 'stroke-default',
  warning: 'stroke-warning-foreground-strong',
  critical: 'stroke-critical-foreground-strong',
};

const HIT =
  'cursor-pointer fill-transparent outline-none hover:fill-[color-mix(in_oklab,var(--primary-background)_6%,transparent)]';

const GLYPH_WORLD = 30;
const GLYPH_MAX = 128;

const toneText = (tone: Tone): string => (isAbnormal(tone) ? TONE_TEXT[tone] : 'text-base-foreground');

/**
 * A plot plan with semantic zoom: one canvas that flies from the whole site into an area, a
 * machine and a single measurement point, revealing more as it gets closer — roll-up figures on
 * the area blocks, then equipment symbols with their state, then the points around a machine with
 * live values, then a card for one point. Text and strokes keep their size at every zoom.
 *
 * Works with a pointer (click what you want to enter) and from the keyboard: arrows move between
 * the children of the current node, Enter goes in, Escape or Backspace goes up.
 */
export function PlotPlan({ tree, layout, state, dispatch, links = [], symbols = {}, label, animate = true, sensorCard, children, className }: PlotPlanProps) {
  const baseId = useId().replace(/:/g, '');
  const [hasFocus, setHasFocus] = useState(false);
  const current = currentNode(tree, state);
  const { value: viewport, settled } = useTween(viewportFor(layout, current), mixViewport, { key: current.id, animate, durationMs: 600 });
  const scale = viewportScale(layout, viewport);
  const { width, height } = layout.world;
  const onPath = new Set(state.path);
  const depth = state.path.length - 1;

  // Each layer fades in part of the way between the zoom of one level and the next.
  const scales = levelScales(layout, tree);
  const siteDetail = 1 - reveal(scale, between(1, scales.area, 0.2), between(1, scales.area, 0.6));
  const areaHeader = reveal(scale, between(1, scales.area, 0.5), between(1, scales.area, 0.9));
  const equipmentDetail = reveal(scale, between(1, scales.area, 0.35), between(1, scales.area, 0.85));
  const sensorDetail = reveal(scale, between(scales.area, scales.equipment, 0.4), between(scales.area, scales.equipment, 0.8));

  // Machine labels would be cut by the frame once the view closes in on one of its points.
  const machineLabels = 1 - reveal(scale, between(scales.equipment, scales.sensor, 0.25), between(scales.equipment, scales.sensor, 0.7));

  const at = (x: number, y: number) => project(layout, viewport, x, y);
  const rectOf = (id: string): PlanRect | null => {
    const place = layout.places.get(id);
    return place ? projectRect(layout, viewport, place.rect) : null;
  };
  const visible = (rect: PlanRect): boolean => rect.x < width && rect.y < height && rect.x + rect.width > 0 && rect.y + rect.height > 0;
  const elementId = (id: string): string => `${baseId}-${id}`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = drillKeyAction(event.key, state);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    dispatch(action);
  };

  const areas = tree.root.children;
  const equipment = descendantsAt(tree.root, 'equipment');
  const focusRect = hasFocus && state.focusId ? rectOf(state.focusId) : null;
  const gridCell = 50 * scale;
  const glyph = Math.min(GLYPH_WORLD * scale, GLYPH_MAX);

  return (
    <div
      data-slot="plot-plan"
      data-level={current.level}
      data-settled={settled ? 'true' : 'false'}
      role="group"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={state.focusId ? elementId(state.focusId) : undefined}
      onKeyDown={onKeyDown}
      onFocus={(event) => setHasFocus(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setHasFocus(false)}
      className={cn('relative size-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-default', className)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="block size-full select-none">
        <defs>
          <pattern
            id={`${baseId}-grid`}
            patternUnits="userSpaceOnUse"
            x={-viewport.x * scale}
            y={-viewport.y * scale}
            width={gridCell}
            height={gridCell}
          >
            <path d={`M ${gridCell} 0 H 0 V ${gridCell}`} fill="none" strokeWidth={1} className="stroke-default" opacity={0.55} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${baseId}-grid)`} />

        {links.map((link) => {
          const from = layout.places.get(link.from);
          const to = layout.places.get(link.to);
          if (!from || !to) return null;
          const segment = linkSegment(from.rect, to.rect);
          const start = at(segment.x1, segment.y1);
          const end = at(segment.x2, segment.y2);
          const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
          const ux = (end.x - start.x) / length;
          const uy = (end.y - start.y) / length;
          const head = 7;
          return (
            <g key={`${link.from}-${link.to}`} data-slot="plot-plan-link" className="stroke-emphasized fill-emphasized">
              <line x1={start.x} y1={start.y} x2={end.x - ux * head} y2={end.y - uy * head} strokeWidth={2} strokeDasharray={link.dashed ? '5 4' : undefined} />
              <polygon
                strokeWidth={0}
                points={`${end.x},${end.y} ${end.x - ux * head - uy * head * 0.6},${end.y - uy * head + ux * head * 0.6} ${end.x - ux * head + uy * head * 0.6},${end.y - uy * head - ux * head * 0.6}`}
              />
            </g>
          );
        })}

        {areas.map((area) => {
          const rect = rectOf(area.id);
          if (!rect || !visible(rect)) return null;
          const abnormal = isAbnormal(area.status.tone);
          const machines = area.children;
          const dimmed = depth >= 1 && !onPath.has(area.id);
          const pad = 22;
          const column = (rect.width - pad * 2) / 3;
          const figures = [
            { label: 'Health', value: `${formatValue(area.healthScore ?? null)} %`, tone: area.figure.tone },
            { label: 'Open alarms', value: formatValue(area.metrics[OPEN_ALARMS_METRIC] ?? 0), tone: 'neutral' as const },
            { label: 'Sensors', value: formatValue(descendantsAt(area, 'sensor').length), tone: 'neutral' as const },
          ];
          return (
            <g key={area.id} data-slot="plot-plan-area" data-tone={area.status.tone} opacity={dimmed ? 0.45 : 1}>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={10}
                strokeWidth={abnormal && depth === 0 ? 2 : 1.5}
                className={cn('fill-card-background', depth === 0 ? BLOCK_STROKE[area.status.tone] : 'stroke-default')}
              />

              {siteDetail > 0.01 ? (
                <g opacity={siteDetail} className="pointer-events-none">
                  <text x={rect.x + pad} y={rect.y + 32} fontSize={12} className="fill-muted-foreground font-mono">
                    {area.tag}
                  </text>
                  <SvgStatusMark x={rect.x + rect.width - pad - 5} y={rect.y + 28} size={11} tone={area.status.tone} shape={area.status.shape} />
                  <text x={rect.x + rect.width - pad - 18} y={rect.y + 32} fontSize={12} textAnchor="end" className={cn('fill-current', abnormal ? TONE_TEXT[area.status.tone] : 'text-muted-foreground')}>
                    {area.status.label}
                  </text>
                  <text x={rect.x + pad} y={rect.y + 62} fontSize={20} className="fill-base-foreground font-semibold">
                    {area.name}
                  </text>
                  <text x={rect.x + pad} y={rect.y + 86} fontSize={12} className="fill-muted-foreground">
                    {childSummary(area)}
                  </text>
                  {machines.map((machine, index) => (
                    <SvgStatusMark key={machine.id} x={rect.x + pad + 7 + index * 24} y={rect.y + 116} size={13} tone={machine.status.tone} shape={machine.status.shape} />
                  ))}
                  {figures.map((figure, index) => (
                    <g key={figure.label}>
                      <text x={rect.x + pad + index * column} y={rect.y + rect.height - 62} fontSize={11.5} className="fill-muted-foreground">
                        {figure.label}
                      </text>
                      <text
                        x={rect.x + pad + index * column}
                        y={rect.y + rect.height - 30}
                        fontSize={26}
                        className={cn('fill-current font-semibold tabular-nums', toneText(figure.tone))}
                      >
                        {figure.value}
                      </text>
                    </g>
                  ))}
                </g>
              ) : null}

              {areaHeader > 0.01 ? (
                <g opacity={areaHeader} className="pointer-events-none">
                  <text x={rect.x + 18} y={rect.y + 28} fontSize={13}>
                    <tspan className="fill-muted-foreground font-mono">{area.tag}</tspan>
                    <tspan dx={10} className="fill-base-foreground font-semibold">
                      {area.name}
                    </tspan>
                  </text>
                  <SvgStatusMark x={rect.x + rect.width - 23} y={rect.y + 24} size={11} tone={area.status.tone} shape={area.status.shape} />
                  <text x={rect.x + rect.width - 36} y={rect.y + 28} fontSize={12} textAnchor="end" className={cn('fill-current', abnormal ? TONE_TEXT[area.status.tone] : 'text-muted-foreground')}>
                    {area.status.label}
                  </text>
                </g>
              ) : null}

              {depth === 0 ? (
                <rect
                  id={elementId(area.id)}
                  role="button"
                  aria-label={`Open area ${area.tag} ${area.name}: ${area.status.label}`}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  rx={10}
                  className={HIT}
                  onClick={() => dispatch({ type: 'drill', id: area.id })}
                />
              ) : null}
            </g>
          );
        })}

        {equipmentDetail > 0.01
          ? equipment.map((machine) => {
              const place = layout.places.get(machine.id);
              const slot = rectOf(machine.id);
              if (!place || !slot || !visible(slot)) return null;
              const centre = at(place.cx, place.cy);
              const abnormal = isAbnormal(machine.status.tone);
              const dimmed = depth >= 2 && !onPath.has(machine.id);
              const labelTop = centre.y + glyph / 2 + 18;
              return (
                <g key={machine.id} data-slot="plot-plan-equipment" data-tone={machine.status.tone} opacity={equipmentDetail * (dimmed ? 0.3 : 1)}>
                  <g aria-hidden="true" className="pointer-events-none">
                    <EquipmentSymbol
                      kind={symbols[machine.kind] ?? 'vertical-vessel'}
                      cx={centre.x}
                      cy={centre.y}
                      size={glyph}
                      tone={abnormal ? machine.status.tone : 'neutral'}
                      fill={machine.runState === 'running' ? 'soft' : 'none'}
                      dashed={machine.runState === 'maintenance' || machine.runState === 'stopped'}
                    />
                  </g>
                  <g opacity={machineLabels} className="pointer-events-none">
                    <text x={centre.x} y={labelTop} fontSize={12} textAnchor="middle" className="fill-muted-foreground font-mono">
                      {machine.tag}
                    </text>
                    <text x={centre.x} y={labelTop + 17} fontSize={13} textAnchor="middle" className="fill-base-foreground font-medium">
                      {machine.name}
                    </text>
                    <SvgStatusMark x={centre.x - machine.status.label.length * 3.1 - 9} y={labelTop + 30} size={9} tone={machine.status.tone} shape={machine.status.shape} />
                    <text x={centre.x + 6} y={labelTop + 34} fontSize={12} textAnchor="middle" className={cn('fill-current', abnormal ? TONE_TEXT[machine.status.tone] : 'text-muted-foreground')}>
                      {machine.status.label}
                    </text>
                  </g>
                  {depth >= 1 && equipmentDetail > 0.6 ? (
                    <rect
                      id={elementId(machine.id)}
                      role="button"
                      aria-label={`Open ${machine.tag} ${machine.name}: ${machine.status.label}`}
                      x={slot.x + 3}
                      y={slot.y + 3}
                      width={Math.max(slot.width - 6, 0)}
                      height={Math.max(slot.height - 6, 0)}
                      rx={8}
                      className={HIT}
                      onClick={() => dispatch({ type: 'jump', id: machine.id })}
                    />
                  ) : null}
                </g>
              );
            })
          : null}

        {sensorDetail > 0.01
          ? equipment.flatMap((machine) => {
              const machinePlace = layout.places.get(machine.id);
              const slot = rectOf(machine.id);
              if (!machinePlace || !slot || !visible(slot)) return [];
              const machineCentre = at(machinePlace.cx, machinePlace.cy);
              // Only the machine you are on shows its points; a neighbour's would be cut by the frame.
              if (!onPath.has(machine.id)) return [];
              return machine.children.map((sensor) => {
                const place = layout.places.get(sensor.id);
                const hit = rectOf(sensor.id);
                if (!place || !hit) return null;
                const point = at(place.cx, place.cy);
                const left = place.side === 'left';
                const direction = left ? -1 : 1;
                const abnormal = isAbnormal(sensor.status.tone);
                const selected = current.id === sensor.id;
                const textX = point.x + direction * 21;
                const anchor = left ? 'end' : 'start';
                const reading = sensor.reading;
                return (
                  <g key={sensor.id} data-slot="plot-plan-sensor" data-tone={sensor.status.tone} opacity={sensorDetail}>
                    <line
                      x1={machineCentre.x + direction * (glyph / 2 + 4)}
                      y1={point.y}
                      x2={point.x - direction * 9}
                      y2={point.y}
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      className="stroke-emphasized"
                    />
                    {selected ? (
                      <circle cx={point.x} cy={point.y} r={15} fill="none" strokeWidth={2} className="stroke-primary-background" data-slot="plot-plan-selection" />
                    ) : null}
                    <circle cx={point.x} cy={point.y} r={8} strokeWidth={1.5} className="fill-card-background stroke-emphasized" />
                    <SvgStatusMark x={point.x} y={point.y} size={9} tone={sensor.status.tone} shape={sensor.status.shape} />
                    <g className="pointer-events-none">
                      <text x={textX} y={point.y - 8} fontSize={11} textAnchor={anchor} className="fill-muted-foreground font-mono">
                        {sensor.tag}
                      </text>
                      <text x={textX} y={point.y + 9} fontSize={14} textAnchor={anchor} className={cn('fill-current font-semibold tabular-nums', toneText(sensor.status.tone))}>
                        {formatValue(reading?.value ?? null, reading?.decimals ?? 0)}
                        {reading && reading.value !== null ? (
                          <tspan dx={4} fontSize={11} className="fill-muted-foreground font-normal">
                            {reading.unit}
                          </tspan>
                        ) : null}
                      </text>
                      {abnormal ? (
                        <text x={textX} y={point.y + 24} fontSize={11} textAnchor={anchor} className={cn('fill-current', TONE_TEXT[sensor.status.tone])}>
                          {sensor.status.label}
                        </text>
                      ) : null}
                    </g>
                    {sensorDetail > 0.6 ? (
                      <rect
                        id={elementId(sensor.id)}
                        role="button"
                        aria-label={`Open ${sensor.tag} ${sensor.name}: ${sensor.status.label}`}
                        x={hit.x}
                        y={hit.y + 2}
                        width={hit.width}
                        height={Math.max(hit.height - 4, 0)}
                        rx={8}
                        className={HIT}
                        onClick={() => dispatch({ type: 'jump', id: sensor.id })}
                      />
                    ) : null}
                  </g>
                );
              });
            })
          : null}

        {focusRect ? (
          <rect
            data-slot="plot-plan-focus"
            x={focusRect.x + 2}
            y={focusRect.y + 2}
            width={Math.max(focusRect.width - 4, 0)}
            height={Math.max(focusRect.height - 4, 0)}
            rx={9}
            fill="none"
            strokeWidth={2}
            className="pointer-events-none stroke-ring-default"
          />
        ) : null}
      </svg>

      {current.level === 'sensor' && sensorCard ? (
        <div
          data-slot="plot-plan-card"
          className={cn(
            'absolute inset-y-3 right-3 flex w-[55%] flex-col motion-safe:transition-[opacity,transform] motion-safe:duration-300',
            settled ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
          )}
        >
          {sensorCard(current)}
        </div>
      ) : null}

      {children}

      <span className="sr-only" aria-live="polite">
        {LEVEL_LABEL[current.level]}: {current.name}. {childSummary(current)}.
      </span>
    </div>
  );
}
