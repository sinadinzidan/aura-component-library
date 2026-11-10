import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { formatReading } from '../../industrial/status';

import { sankeyLayout, sankeyLinkId, sankeyPath } from './sankeyLayout';
import type { SankeyLinkInput, SankeyNodeInput, SankeySelection } from './sankeyLayout';

/** Which chart ramp a node or ribbon draws in. `neutral` is for things that are not a category of their own. */
export type SankeySeries = 1 | 2 | 3 | 4 | 5 | 'neutral';

export type SankeyDiagramNode = SankeyNodeInput & { series?: SankeySeries };
export type SankeyDiagramLink = SankeyLinkInput & { series?: SankeySeries };

export type SankeyDiagramProps = {
  nodes: readonly SankeyDiagramNode[];
  links: readonly SankeyDiagramLink[];
  unit: string;
  decimals?: number;
  /** Accessible name, e.g. "Energy flow from sources to consumers to outcomes". */
  label: string;
  selection: SankeySelection | null;
  onSelect: (selection: SankeySelection) => void;
  className?: string;
};

const BOX = { width: 1000, height: 440, nodeWidth: 16, nodeGap: 30 };

/** Literal classes so Tailwind generates them. */
const NODE_FILL: Record<SankeySeries, string> = {
  1: 'fill-chart-1-450',
  2: 'fill-chart-2-450',
  3: 'fill-chart-3-450',
  4: 'fill-chart-4-450',
  5: 'fill-chart-5-450',
  neutral: 'fill-chart-neutral-450',
};

const LINK_FILL: Record<SankeySeries, string> = {
  1: 'fill-chart-1-300',
  2: 'fill-chart-2-300',
  3: 'fill-chart-3-300',
  4: 'fill-chart-4-300',
  5: 'fill-chart-5-300',
  neutral: 'fill-chart-neutral-300',
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * A three-part flow diagram: where it comes from, what uses it and where it ends up. Ribbons are
 * as thick as the flow they carry. Hovering or selecting a node or a ribbon lights up the whole
 * path it belongs to and dims the rest; the selection is reported so a panel beside the diagram
 * can explain it. Node names are buttons, so every node can be selected from the keyboard, and
 * ribbons are focusable too.
 */
export function SankeyDiagram({ nodes, links, unit, decimals = 0, label, selection, onSelect, className }: SankeyDiagramProps) {
  const [hovered, setHovered] = useState<SankeySelection | null>(null);
  const layout = sankeyLayout(nodes, links, BOX);
  const seriesOf = new Map(nodes.map((node) => [node.id, node.series ?? 'neutral']));
  const linkSeries = new Map(links.map((link) => [sankeyLinkId(link), link.series ?? seriesOf.get(link.source) ?? 'neutral']));
  const labelOf = new Map(nodes.map((node) => [node.id, node.label]));
  const active = hovered ?? selection;
  const path = sankeyPath(layout.links, active);
  const columns = [...new Set(nodes.map((node) => node.column))].sort((a, b) => a - b);
  const firstColumn = columns[0];
  const lastColumn = columns[columns.length - 1];
  const isSelected = (kind: SankeySelection['kind'], id: string): boolean => selection?.kind === kind && selection.id === id;

  const nodeButton = (node: (typeof layout.nodes)[number], align: 'start' | 'end') => (
    <button
      key={node.id}
      type="button"
      data-slot="sankey-node-label"
      aria-label={`${node.label}: ${formatReading(node.value, unit, decimals)}`}
      aria-pressed={isSelected('node', node.id)}
      onClick={() => onSelect({ kind: 'node', id: node.id })}
      onMouseEnter={() => setHovered({ kind: 'node', id: node.id })}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered({ kind: 'node', id: node.id })}
      onBlur={() => setHovered(null)}
      className={cn(
        'flex cursor-pointer flex-col rounded-md px-1.5 py-0.5 outline-none transition-opacity motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        active && !path.nodes.has(node.id) ? 'opacity-50' : undefined,
        isSelected('node', node.id) ? 'bg-muted-background' : 'hover:bg-muted-background'
      )}
    >
      <span className="text-xs font-medium text-base-foreground">{node.label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{formatReading(node.value, unit, decimals)}</span>
    </button>
  );

  const gutter = (column: number | undefined, align: 'start' | 'end') => (
    <div className="relative h-full min-w-0">
      {layout.nodes
        .filter((node) => node.column === column)
        .map((node) => (
          <div
            key={node.id}
            className={cn('absolute flex w-full -translate-y-1/2', align === 'end' ? 'justify-end' : 'justify-start')}
            style={{ top: percent((node.y + node.height / 2) / BOX.height) }}
          >
            {nodeButton(node, align)}
          </div>
        ))}
    </div>
  );

  return (
    <div
      data-slot="sankey-diagram"
      className={cn('grid h-[27rem] w-full min-w-0 grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_minmax(0,7.5rem)] gap-1', className)}
    >
      {gutter(firstColumn, 'end')}
      <div className="relative h-full min-w-0">
        <svg role="group" aria-label={label} viewBox={`0 0 ${BOX.width} ${BOX.height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          {layout.links.map((link) => {
            const lit = path.links.has(link.id);
            const text = `${labelOf.get(link.source) ?? link.source} to ${labelOf.get(link.target) ?? link.target}: ${formatReading(link.value, unit, decimals)}`;
            return (
              <path
                key={link.id}
                data-slot="sankey-link"
                data-lit={active ? String(lit) : undefined}
                role="button"
                tabIndex={0}
                aria-label={text}
                aria-pressed={isSelected('link', link.id)}
                d={link.path}
                onClick={() => onSelect({ kind: 'link', id: link.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect({ kind: 'link', id: link.id });
                  }
                }}
                onMouseEnter={() => setHovered({ kind: 'link', id: link.id })}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered({ kind: 'link', id: link.id })}
                onBlur={() => setHovered(null)}
                className={cn(
                  'cursor-pointer outline-none transition-opacity duration-200 motion-reduce:transition-none focus-visible:stroke-[color:var(--ring-default)] focus-visible:stroke-2',
                  LINK_FILL[linkSeries.get(link.id) ?? 'neutral'],
                  active ? (lit ? 'opacity-90' : 'opacity-20') : 'opacity-55'
                )}
              >
                <title>{text}</title>
              </path>
            );
          })}
          {layout.nodes.map((node) => (
            <rect
              key={node.id}
              data-slot="sankey-node"
              aria-hidden
              x={node.x}
              y={node.y}
              width={node.width}
              height={Math.max(node.height, 1)}
              onClick={() => onSelect({ kind: 'node', id: node.id })}
              onMouseEnter={() => setHovered({ kind: 'node', id: node.id })}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'cursor-pointer transition-opacity duration-200 motion-reduce:transition-none',
                NODE_FILL[seriesOf.get(node.id) ?? 'neutral'],
                active && !path.nodes.has(node.id) ? 'opacity-30' : undefined
              )}
            />
          ))}
        </svg>
        {/* Names of the middle nodes sit in the gap above each bar. */}
        {layout.nodes
          .filter((node) => node.column !== firstColumn && node.column !== lastColumn)
          .map((node) => (
            <div
              key={node.id}
              className="absolute -translate-y-full [&>button]:flex-row [&>button]:items-baseline [&>button]:gap-1.5 [&>button]:whitespace-nowrap"
              style={{ left: percent(node.x / BOX.width), top: percent(node.y / BOX.height) }}
            >
              {nodeButton(node, 'start')}
            </div>
          ))}
      </div>
      {gutter(lastColumn, 'start')}
    </div>
  );
}
