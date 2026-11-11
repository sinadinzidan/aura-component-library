import { useState } from 'react';
import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';
import { barrierStatus } from '../domains/safety';
import type { BarrierState } from '../domains/safety';
import { TONE_TEXT } from '../status';
import type { DotShape, Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { BARRIER_TYPE_LABEL, COMPACT_METRICS, DEFAULT_METRICS, bowTieLayout } from './bowTieLayout';
import type { BarrierNode, BowTieModel, BowTieSeverity, PathNode } from './bowTieLayout';

export type BowTieDiagramProps = {
  /** What the bow-tie covers, e.g. "Bow-tie for loss of containment, gas compression". */
  label: string;
  model: BowTieModel;
  /** Id of the barrier whose detail is open. Every placement of it is marked. */
  selectedBarrierId?: string | null;
  /** Makes barriers selectable. Called with the barrier id. */
  onSelectBarrier?: (barrierId: string) => void;
  /** Barriers shrink to a state mark; use with a summary table that carries the names. */
  compact?: boolean;
  /** Key under the drawing: the three barrier states and the escalation factor. */
  legend?: boolean;
  /** Shown instead of the drawing when the model has no threats and no consequences. */
  emptyText?: string;
  className?: string;
};

const SEVERITY: Record<BowTieSeverity, { tone: Tone; label: string; shape: DotShape }> = {
  minor: { tone: 'neutral', label: 'Minor', shape: 'ring' },
  major: { tone: 'warning', label: 'Major', shape: 'square' },
  severe: { tone: 'critical', label: 'Severe', shape: 'diamond' },
};

const STATES: readonly BarrierState[] = ['healthy', 'degraded', 'impaired'];

/** The same four marks as `StatusDot`, drawn in SVG so they scale with the diagram. */
function Glyph({ shape, cx, cy, size, className }: { shape: DotShape; cx: number; cy: number; size: number; className?: string }) {
  const r = size / 2;
  if (shape === 'square') return <rect x={cx - r} y={cy - r} width={size} height={size} fill="currentColor" className={className} />;
  if (shape === 'diamond') return <path d={`M ${cx} ${cy - r * 1.25} L ${cx + r * 1.25} ${cy} L ${cx} ${cy + r * 1.25} L ${cx - r * 1.25} ${cy} Z`} fill="currentColor" className={className} />;
  if (shape === 'ring') return <circle cx={cx} cy={cy} r={r - 0.75} stroke="currentColor" strokeWidth={1.5} className={className} />;
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" className={className} />;
}

function Lines({ lines, x, y, lineHeight, fontSize, className, anchor = 'middle' }: { lines: readonly string[]; x: number; y: number; lineHeight: number; fontSize: number; className?: string; anchor?: 'start' | 'middle' }) {
  return (
    <text x={x} y={y} fontSize={fontSize} textAnchor={anchor} className={className}>
      {lines.map((line, index) => (
        <tspan key={`${index}-${line}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * A bow-tie diagram in inline SVG: the hazard and top event in the centre, threats with their
 * prevention barriers on the left, consequences with their mitigation barriers on the right, and
 * escalation factors under the barriers they can defeat. Barrier health is a shape and a word.
 * Hovering or focusing a barrier or an end point picks out its path; selecting a barrier reports
 * its id so a detail panel can open beside the drawing.
 */
export function BowTieDiagram({ label, model, selectedBarrierId = null, onSelectBarrier, compact = false, legend = true, emptyText = 'No paths to show.', className }: BowTieDiagramProps) {
  const [activePath, setActivePath] = useState<string | null>(null);
  const metrics = compact ? COMPACT_METRICS : DEFAULT_METRICS;
  const layout = bowTieLayout(model, metrics);
  const selectable = onSelectBarrier !== undefined;
  const pathName = new Map([...model.threats, ...model.consequences].map((path) => [path.id, path.name]));
  const isEmpty = model.threats.length === 0 && model.consequences.length === 0;

  const activate = (pathId: string) => ({
    onMouseEnter: () => setActivePath(pathId),
    onMouseLeave: () => setActivePath((current) => (current === pathId ? null : current)),
  });
  const dimmed = (pathId: string): boolean => activePath !== null && activePath !== pathId;

  const renderPathNode = (node: PathNode) => {
    const severity = node.severity ? SEVERITY[node.severity] : undefined;
    const textLines = node.lines.length + (severity && !compact ? 1 : 0);
    const lineHeight = compact ? 11 : 12.5;
    const fontSize = compact ? 9.5 : 11;
    const first = node.y + node.height / 2 - ((textLines - 1) * lineHeight) / 2 + fontSize * 0.35;
    const left = node.x + (compact ? 8 : 10);
    return (
      <g key={node.id} data-slot="bow-tie-path" data-side={node.side} data-active={activePath === node.id} opacity={dimmed(node.id) ? 0.45 : 1} {...activate(node.id)}>
        <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={6} stroke="currentColor" strokeWidth={activePath === node.id ? 2 : 1} vectorEffect="non-scaling-stroke" className="fill-muted-background" />
        <Lines lines={node.lines} x={left} y={first} lineHeight={lineHeight} fontSize={fontSize} anchor="start" className="fill-base-foreground" />
        {severity && !compact ? (
          <g className={TONE_TEXT[severity.tone]}>
            <Glyph shape={severity.shape} cx={left + 4} cy={first + node.lines.length * lineHeight - 3.5} size={7} />
            <text x={left + 12} y={first + node.lines.length * lineHeight} fontSize={9.5} className="fill-medium-foreground">
              {severity.label}
            </text>
          </g>
        ) : null}
        {severity && compact ? <title>{`${severity.label} consequence`}</title> : null}
      </g>
    );
  };

  const renderBarrier = (node: BarrierNode) => {
    const status = barrierStatus(node.barrier.state);
    const selected = selectedBarrierId === node.barrier.id;
    const name = `${node.barrier.name}, ${BARRIER_TYPE_LABEL[node.barrier.type].toLowerCase()} barrier, ${status.label.toLowerCase()}, on path ${pathName.get(node.pathId) ?? node.pathId}`;
    const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectBarrier?.(node.barrier.id);
      }
    };
    const interactive = selectable
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-pressed': selected,
          onClick: () => onSelectBarrier?.(node.barrier.id),
          onKeyDown: handleKeyDown,
          onFocus: () => setActivePath(node.pathId),
          onBlur: () => setActivePath((current) => (current === node.pathId ? null : current)),
        }
      : { role: 'img' };
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const weakened = node.barrier.state !== 'healthy';

    return (
      <g key={node.key} data-slot="bow-tie-barrier" data-state={node.barrier.state} data-selected={selected} opacity={dimmed(node.pathId) ? 0.45 : 1} {...activate(node.pathId)}>
        {node.escalation ? (
          <g data-slot="bow-tie-escalation">
            <path d={`M ${cx} ${node.y + node.height} V ${node.escalation.y}`} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <rect x={node.escalation.x} y={node.escalation.y} width={node.escalation.width} height={node.escalation.height} rx={4} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" className="fill-base-background" />
            <Lines
              lines={node.escalation.lines}
              x={cx}
              y={node.escalation.y + node.escalation.height / 2 - ((node.escalation.lines.length - 1) * 10.5) / 2 + 3}
              lineHeight={10.5}
              fontSize={9}
              className="fill-medium-foreground"
            />
          </g>
        ) : null}
        <g aria-label={name} {...interactive} className={cn('group outline-none', selectable && 'cursor-pointer')}>
          {compact ? (
            <>
              <rect x={node.x - 3} y={node.y - 3} width={node.width + 6} height={node.height + 6} rx={5} strokeWidth={selected ? 1.5 : 1} vectorEffect="non-scaling-stroke" className={cn('fill-base-background group-focus-visible:stroke-ring-default', selected ? 'stroke-base-foreground' : 'stroke-transparent')} />
              <g className={TONE_TEXT[status.tone]}>
                <Glyph shape={status.shape} cx={cx} cy={cy} size={11} />
              </g>
              <title>{name}</title>
            </>
          ) : (
            <>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={6}
                strokeWidth={selected ? 2 : 1}
                strokeDasharray={node.barrier.state === 'impaired' ? '5 3' : undefined}
                vectorEffect="non-scaling-stroke"
                className={cn(
                  'fill-base-background transition-colors group-focus-visible:stroke-ring-default',
                  selectable && 'group-hover:fill-muted-background',
                  selected ? 'stroke-base-foreground' : weakened ? cn('stroke-current', TONE_TEXT[status.tone]) : 'stroke-emphasized'
                )}
              />
              <Lines lines={node.lines} x={cx} y={node.y + (node.lines.length > 1 ? 15 : 21)} lineHeight={11.5} fontSize={10} className="fill-base-foreground" />
              <g className={TONE_TEXT[status.tone]}>
                <Glyph shape={status.shape} cx={cx - status.label.length * 2.5 - 5} cy={node.y + node.height - 11.5} size={7} />
              </g>
              <text x={cx + 5} y={node.y + node.height - 8.5} fontSize={9} textAnchor="middle" className="fill-medium-foreground">
                {status.label}
              </text>
            </>
          )}
        </g>
      </g>
    );
  };

  const counts = STATES.map((state) => ({ state, count: layout.barriers.filter((node) => node.barrier.state === state).length }));

  return (
    <div data-slot="bow-tie" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      {isEmpty ? (
        <p data-slot="bow-tie-empty" className="rounded-lg bg-muted-background px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <svg role="group" aria-label={label} viewBox={`0 0 ${layout.width} ${layout.height}`} width="100%" style={{ maxWidth: layout.width }} fill="none" className="mx-auto block h-auto text-medium-foreground">
          {layout.lines.map((line) => (
            <path
              key={line.id}
              data-slot="bow-tie-line"
              data-active={activePath === line.id}
              d={line.d}
              stroke="currentColor"
              strokeWidth={activePath === line.id ? 2.5 : 1.25}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={dimmed(line.id) ? 0.35 : 1}
              className={activePath === line.id ? 'text-base-foreground' : undefined}
            />
          ))}

          <path d={`M ${layout.hazard.x + layout.hazard.width / 2} ${layout.hazard.y + layout.hazard.height} V ${layout.topEvent.y}`} stroke="currentColor" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
          <g data-slot="bow-tie-hazard">
            <rect x={layout.hazard.x} y={layout.hazard.y} width={layout.hazard.width} height={layout.hazard.height} rx={4} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" className="fill-muted-background" />
            {compact ? null : (
              <text x={layout.hazard.x + layout.hazard.width / 2} y={layout.hazard.y + 12} fontSize={8.5} textAnchor="middle" className="fill-muted-foreground">
                Hazard
              </text>
            )}
            <Lines
              lines={layout.hazard.lines}
              x={layout.hazard.x + layout.hazard.width / 2}
              y={layout.hazard.y + (compact ? layout.hazard.height / 2 - ((layout.hazard.lines.length - 1) * 10) / 2 + 3 : 24)}
              lineHeight={compact ? 10 : 11}
              fontSize={compact ? 8.5 : 10}
              className="fill-base-foreground"
            />
          </g>
          <g data-slot="bow-tie-top-event">
            <rect x={layout.topEvent.x} y={layout.topEvent.y} width={layout.topEvent.width} height={layout.topEvent.height} rx={layout.topEvent.height / 2} strokeWidth={2} vectorEffect="non-scaling-stroke" className="fill-base-background stroke-base-foreground" />
            {compact ? null : (
              <text x={layout.topEvent.x + layout.topEvent.width / 2} y={layout.topEvent.y + 17} fontSize={8.5} textAnchor="middle" className="fill-muted-foreground">
                Top event
              </text>
            )}
            <Lines
              lines={layout.topEvent.lines}
              x={layout.topEvent.x + layout.topEvent.width / 2}
              y={layout.topEvent.y + layout.topEvent.height / 2 - ((layout.topEvent.lines.length - 1) * (compact ? 11 : 13)) / 2 + (compact ? 3 : 8)}
              lineHeight={compact ? 11 : 13}
              fontSize={compact ? 9.5 : 11}
              className="fill-base-foreground font-medium"
            />
          </g>

          {layout.threats.map(renderPathNode)}
          {layout.consequences.map(renderPathNode)}
          {layout.barriers.map(renderBarrier)}
        </svg>
      )}

      {legend && !isEmpty ? (
        <ul data-slot="bow-tie-legend" aria-label="Key" className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {counts.map(({ state, count }) => (
            <li key={state}>
              <StatusIndicator size="sm" {...barrierStatus(state)} detail={`${count}`} />
            </li>
          ))}
          {metrics.showEscalation ? (
            <li className="flex items-center gap-1.5 text-xs text-medium-foreground">
              <span aria-hidden="true" className="h-3 w-5 rounded-sm border border-dashed border-emphasized" />
              Escalation factor
            </li>
          ) : null}
          <li className="text-xs text-muted-foreground">Threats and prevention on the left · consequences and mitigation on the right</li>
        </ul>
      ) : null}
    </div>
  );
}
