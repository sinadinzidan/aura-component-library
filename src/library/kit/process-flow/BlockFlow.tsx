import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { LINE_WEIGHT, svgBlockPaint } from './anatomy';
import { arrowHead, blockBox, metricsFor, routeBetween, routePath } from './blockRoute';

export type FlowBlock = {
  id: string;
  label: string;
  /** Second line: a tag or a reading. */
  detail?: string;
  col: number;
  row: number;
  tone?: Tone;
  /** `terminal` is a source or a destination outside the unit: drawn as a pill without a fill. */
  kind?: 'unit' | 'terminal';
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  /** Stream number or rate, printed on the line. */
  label?: string;
  /** `utility` is a thin dashed line, `stopped` a broken line with no arrow. */
  kind?: 'process' | 'utility' | 'stopped';
  tone?: Tone;
};

type BlockFlowProps = {
  /** What the diagram shows, for assistive technology. */
  label: string;
  blocks: readonly FlowBlock[];
  edges: readonly FlowEdge[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * A block flow diagram: units on a grid joined by right-angled lines with the stream written on
 * them. Blocks take the look's anatomy and their tone; recycles loop over the top; utilities are
 * dashed. Cells follow the width of the container while the type stays at its size, so give it the
 * full width of its panel.
 */
export function BlockFlow({ label, blocks, edges, selectedId = null, onSelect, className }: BlockFlowProps) {
  const look = useLook();
  const paint = svgBlockPaint(look);
  const weight = LINE_WEIGHT[look];
  const frame = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const cols = Math.max(...blocks.map((block) => block.col)) + 1;
  const rows = Math.max(...blocks.map((block) => block.row)) + 1;
  const metrics = metricsFor(available, cols);
  const width = cols * metrics.cellWidth;
  const height = rows * metrics.cellHeight;

  useEffect(() => {
    const element = frame.current;
    if (!element) return undefined;
    const measure = () => setAvailable(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const byId = new Map(blocks.map((block) => [block.id, block]));

  const activate = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div ref={frame} data-look={look} className={cx('flex w-full min-w-0 justify-center overflow-x-auto', className)}>
    <svg role="group" aria-label={label} viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="shrink-0">
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const route = routeBetween(from, to, metrics);
        const stopped = edge.kind === 'stopped';
        const utility = edge.kind === 'utility';
        const color = stopped ? 'var(--kit-text-3)' : 'var(--t-line)';
        return (
          <g key={edge.id} data-tone={edge.tone ?? 'neutral'} data-edge={edge.id} data-kind={edge.kind ?? 'process'}>
            <path d={routePath(route.points)} fill="none" style={{ stroke: color }} strokeWidth={utility ? Math.max(1.25, weight - 0.75) : weight} strokeDasharray={stopped ? '3 5' : utility ? '7 4' : undefined} strokeLinejoin={paint.radius > 0 ? 'round' : 'miter'} />
            {stopped ? null : <path d={arrowHead(route.points[route.points.length - 1], route.heading, 6 + weight)} style={{ fill: color }} />}
            {edge.label ? (
              <text x={route.label.x} y={route.label.y - 7} textAnchor="middle" fontSize={12} fontWeight={600} style={{ fill: 'var(--kit-text-2)', stroke: 'var(--kit-halo)', strokeWidth: 4, paintOrder: 'stroke', fontVariantNumeric: 'tabular-nums' }}>
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {blocks.map((block) => {
        const box = blockBox(block, metrics);
        const selected = block.id === selectedId;
        const terminal = block.kind === 'terminal';
        const interactive = onSelect
          ? { role: 'button', tabIndex: 0, 'aria-pressed': selected, onClick: () => onSelect(block.id), onKeyDown: (event: KeyboardEvent<SVGGElement>) => activate(event, block.id), style: { cursor: 'pointer' } }
          : {};
        return (
          <g key={block.id} data-tone={block.tone ?? 'neutral'} data-block={block.id} aria-label={block.detail ? `${block.label}, ${block.detail}` : block.label} className="outline-none focus-visible:[&>rect:first-child]:stroke-(--kit-accent)" {...interactive}>
            {selected ? <rect x={box.x - 5} y={box.y - 5} width={box.width + 10} height={box.height + 10} rx={terminal ? (box.height + 10) / 2 : paint.radius + 4} fill="none" style={{ stroke: 'var(--kit-accent)' }} strokeWidth={2.5} /> : null}
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              rx={terminal ? box.height / 2 : paint.radius}
              style={{ fill: terminal ? 'var(--kit-halo)' : paint.fill, stroke: terminal ? 'var(--kit-rule-strong)' : paint.stroke }}
              strokeWidth={terminal ? 1.5 : paint.strokeWidth}
              strokeDasharray={terminal ? '5 4' : undefined}
            />
            {paint.edge && !terminal ? <rect x={box.x} y={box.y} width={5} height={box.height} style={{ fill: 'var(--t-line)' }} /> : null}
            <text x={box.x + box.width / 2} y={box.y + (block.detail ? 26 : 35)} textAnchor="middle" fontSize={13} fontWeight={600} style={{ fill: terminal ? 'var(--kit-text)' : paint.text }}>
              {block.label}
            </text>
            {block.detail ? (
              <text x={box.x + box.width / 2} y={box.y + 44} textAnchor="middle" fontSize={12} style={{ fill: terminal ? 'var(--kit-text-3)' : paint.subtext, fontVariantNumeric: 'tabular-nums' }}>
                {block.detail}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
    </div>
  );
}
