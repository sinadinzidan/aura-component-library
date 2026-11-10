import { cn } from '../../../lib/utils';

import type { DrillNode } from './hierarchy';
import { NodeRow } from './NodeRow';

export type NodeListProps = {
  nodes: readonly DrillNode[];
  /** Accessible name of the list: "Equipment in Gas compression". */
  label: string;
  onSelect: (id: string) => void;
  /** Called with a node id while a row is hovered or focused, and with `null` when it no longer is. */
  onPreview?: (id: string | null) => void;
  /** The row to pick out, e.g. the one highlighted in a chart beside the list. */
  activeId?: string | null;
  /** Shown when there are no nodes. */
  emptyText?: string;
  className?: string;
};

/**
 * The children of a node as selectable rows with state and a reading each. Sits beside a chart
 * so the same journey works without it: every row is a real button, and hovering or focusing one
 * can light up its counterpart in the chart.
 */
export function NodeList({ nodes, label, onSelect, onPreview, activeId = null, emptyText = 'Nothing below this level', className }: NodeListProps) {
  if (nodes.length === 0) {
    return (
      <p data-slot="node-list-empty" className={cn('text-sm text-muted-foreground', className)}>
        {emptyText}
      </p>
    );
  }

  return (
    <ul data-slot="node-list" aria-label={label} className={cn('flex flex-col gap-0.5', className)}>
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            data-active={node.id === activeId ? 'true' : undefined}
            onClick={() => onSelect(node.id)}
            onMouseEnter={onPreview ? () => onPreview(node.id) : undefined}
            onMouseLeave={onPreview ? () => onPreview(null) : undefined}
            onFocus={onPreview ? () => onPreview(node.id) : undefined}
            onBlur={onPreview ? () => onPreview(null) : undefined}
            className={cn(
              'w-full cursor-pointer rounded-md px-2 py-1.5 outline-none hover:bg-base-background-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-default',
              node.id === activeId ? 'bg-muted-background shadow-[inset_2px_0_0_var(--primary-background)]' : ''
            )}
          >
            <NodeRow node={node} showChevron />
          </button>
        </li>
      ))}
    </ul>
  );
}
