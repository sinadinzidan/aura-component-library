import { cn } from '../../../lib/utils';
import { StatusIndicator } from '../StatusIndicator';

import { causeStatus } from './workflow';
import type { CauseState } from './workflow';

export type FaultTreeGate = 'AND' | 'OR';

export type FaultTreeNode = {
  id: string;
  label: string;
  /** How the children combine to cause this event. Only on nodes with children. */
  gate?: FaultTreeGate;
  /** Where the investigation stands on this event. */
  state?: CauseState;
  children?: readonly FaultTreeNode[];
};

export type FaultTreeProps = {
  root: FaultTreeNode;
  /** What the tree explains, e.g. "Fault tree, recompressor trip". */
  label: string;
  className?: string;
};

const GATE_WORD: Record<FaultTreeGate, string> = { AND: 'all of', OR: 'any of' };

function FaultTreeBranch({ node, depth }: { node: FaultTreeNode; depth: number }) {
  const children = node.children ?? [];
  return (
    <li data-slot="fault-tree-node" data-depth={depth} className="flex flex-col">
      <div className="flex min-h-8 items-center gap-2 py-1">
        <span
          className={cn(
            'min-w-0 flex-1 text-sm',
            depth === 0 ? 'font-medium text-base-foreground' : node.state === 'ruled-out' ? 'text-muted-foreground' : 'text-base-foreground'
          )}
        >
          {node.label}
        </span>
        {node.gate && children.length > 0 ? (
          <span
            data-slot="fault-tree-gate"
            title={`Caused by ${GATE_WORD[node.gate]} the events below`}
            className="inline-flex h-5 shrink-0 items-center rounded-md border border-emphasized px-1.5 font-mono text-xs text-base-foreground"
          >
            {node.gate}
            <span className="sr-only">: caused by {GATE_WORD[node.gate]} the events below</span>
          </span>
        ) : null}
        <span className="w-24 shrink-0">{node.state ? <StatusIndicator size="sm" {...causeStatus(node.state)} /> : null}</span>
      </div>
      {children.length > 0 ? (
        <ul className="ml-2 flex flex-col border-l border-emphasized pl-4">
          {children.map((child) => (
            <FaultTreeBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * A fault tree as an indented list: the top event first, each level its possible causes, with an
 * AND or OR gate on every event that has causes and the investigation state on each.
 */
export function FaultTree({ root, label, className }: FaultTreeProps) {
  return (
    <ul data-slot="fault-tree" aria-label={label} className={cn('flex w-full flex-col', className)}>
      <FaultTreeBranch node={root} depth={0} />
    </ul>
  );
}
