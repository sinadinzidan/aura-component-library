import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';
import { arcPath, fractionToAngle, toFraction } from '../../industrial/geometry';
import { formatValue } from '../../industrial/status';
import type { DotShape, Tone } from '../../industrial/status';

export type OrbitNodeProps = {
  /** Centre of the node in the parent drawing. */
  cx: number;
  cy: number;
  radius?: number;
  /** Full name, for the accessible name. */
  label: string;
  /** Short code printed under the gauge, such as an area tag. */
  code: string;
  /** Gauge value, 0–100 unless `max` says otherwise. */
  value: number;
  max?: number;
  unit?: string;
  tone?: Tone;
  /** State in words; shape repeats it so it survives without colour. */
  stateLabel: string;
  shape?: DotShape;
  selected?: boolean;
  /** Degrees to turn the node's own content, so it stays upright while its orbit rotates. */
  counterRotation?: number;
  onSelect?: () => void;
  className?: string;
};

const NODE_TONE: Record<Tone, string> = {
  neutral: '[--node:var(--primary-background)]',
  success: '[--node:var(--primary-background)]',
  info: '[--node:var(--info-foreground-strong)]',
  warning: '[--node:var(--warning-foreground-strong)]',
  critical: '[--node:var(--critical-foreground-strong)]',
};

const TURN = 'transition-transform duration-700 ease-in-out motion-reduce:transition-none';

function shapePath(shape: DotShape, x: number, y: number, size: number): string {
  if (shape === 'diamond') return `M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`;
  if (shape === 'square') return `M ${x - size * 0.8} ${y - size * 0.8} h ${size * 1.6} v ${size * 1.6} h ${-size * 1.6} Z`;
  return `M ${x - size} ${y} a ${size} ${size} 0 1 0 ${size * 2} 0 a ${size} ${size} 0 1 0 ${-size * 2} 0 Z`;
}

/**
 * One system on an orbit round a central dial: a small arc gauge with its value, a short code
 * and a state mark. It is an SVG fragment and a button — click, Enter or Space selects it.
 * Pick it when a handful of peers must be compared at a glance and one of them opened.
 */
export function OrbitNode({
  cx,
  cy,
  radius = 30,
  label,
  code,
  value,
  max = 100,
  unit = '%',
  tone = 'neutral',
  stateLabel,
  shape = 'dot',
  selected = false,
  counterRotation = 0,
  onSelect,
  className,
}: OrbitNodeProps) {
  const arcRadius = radius - 5;
  const end = fractionToAngle(toFraction(value, 0, max));
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect?.();
  };

  return (
    <g data-slot="orbit-node" data-tone={tone} data-selected={selected} transform={`translate(${cx} ${cy})`} className={cn(NODE_TONE[tone], className)}>
      <g
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${label}: ${formatValue(value, 0)}${unit ? ` ${unit}` : ''}, ${stateLabel}`}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        style={{ transform: `rotate(${counterRotation}deg)` }}
        className={cn('group cursor-pointer outline-none', TURN)}
      >
        <circle
          r={radius + 5}
          strokeWidth={2}
          className="fill-none stroke-transparent group-focus-visible:stroke-[color:var(--ring-default)]"
        />
        <circle
          r={radius}
          strokeWidth={selected ? 2 : 1}
          className={cn(
            'fill-card-background transition-[stroke] group-hover:stroke-[color:var(--node)]',
            selected
              ? 'stroke-[color:var(--node)] [filter:drop-shadow(0_0_10px_color-mix(in_oklab,var(--node)_70%,transparent))]'
              : 'stroke-[color-mix(in_oklab,var(--node)_45%,transparent)]'
          )}
        />
        <path d={arcPath(0, 0, arcRadius, -135, 135)} strokeWidth={4} strokeLinecap="round" fill="none" className="stroke-[color-mix(in_oklab,var(--node)_20%,transparent)]" />
        {toFraction(value, 0, max) > 0 ? (
          <path data-slot="orbit-node-value" d={arcPath(0, 0, arcRadius, -135, end)} strokeWidth={4} strokeLinecap="round" fill="none" className="stroke-[color:var(--node)]" />
        ) : null}
        <text y={-1} textAnchor="middle" dominantBaseline="central" fontSize={radius * 0.5} className="fill-base-foreground font-semibold tabular-nums">
          {formatValue(value, 0)}
        </text>
        <path data-slot="orbit-node-state" data-shape={shape} d={shapePath(shape, 0, radius - 9, 3.5)} strokeWidth={1.5} className={shape === 'ring' ? 'fill-none stroke-[color:var(--node)]' : 'fill-[var(--node)] stroke-[color:var(--node)]'} />
        <text y={radius + 14} textAnchor="middle" dominantBaseline="central" fontSize={12} className={cn('font-mono', selected ? 'fill-base-foreground font-semibold' : 'fill-medium-foreground')}>
          {code}
        </text>
      </g>
    </g>
  );
}
