import { IconChevronRight } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { TONE_TEXT, UNIT_TEXT, formatValue } from '../../industrial/status';
import { StatusDot } from '../../industrial/StatusDot';

import { isAbnormal } from './hierarchy';
import type { DrillNode } from './hierarchy';

export type NodeRowProps = {
  node: DrillNode;
  /** A chevron at the end, for rows that open something. */
  showChevron?: boolean;
  className?: string;
};

/**
 * One node of the hierarchy as three short lines: name, tag with its headline figure, and state.
 * The state is a shape and words; it only takes colour when the node is abnormal. Presentational:
 * wrap it in a button or an option to make it selectable.
 */
export function NodeRow({ node, showChevron = false, className }: NodeRowProps) {
  const abnormal = isAbnormal(node.status.tone);

  return (
    <div data-slot="node-row" data-tone={node.status.tone} className={cn('flex w-full min-w-0 items-start gap-2 text-left', className)}>
      <span className="flex h-5 shrink-0 items-center">
        <StatusDot tone={node.status.tone} shape={node.status.shape} size="sm" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm leading-5 text-base-foreground">{node.name}</span>
        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="font-mono text-xs text-muted-foreground">{node.tag}</span>
          <span className={cn('shrink-0 text-xs font-medium tabular-nums', abnormal ? TONE_TEXT[node.figure.tone] : 'text-base-foreground')}>
            {formatValue(node.figure.value, node.figure.decimals)}
            {node.figure.unit && node.figure.value !== null ? <span className={cn(UNIT_TEXT, 'ml-1')}>{node.figure.unit}</span> : null}
          </span>
        </span>
        <span className={cn('text-xs', abnormal ? TONE_TEXT[node.status.tone] : 'text-muted-foreground')}>{node.status.label}</span>
      </span>
      {showChevron ? (
        <span className="flex h-5 shrink-0 items-center text-muted-foreground">
          <IconChevronRight aria-hidden="true" className="size-4" />
        </span>
      ) : null}
    </div>
  );
}
