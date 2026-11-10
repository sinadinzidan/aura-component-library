import { Badge } from '@cognite/aura/components/badge';

import { priorityMeaning } from './workOrders';
import type { WorkPriority } from './workOrders';

export type PriorityBadgeProps = {
  priority: WorkPriority;
  /** Adds what the code means: "P1 · Immediate". Use where the reader may not know the scale. */
  showMeaning?: boolean;
};

const VARIANT = { P1: 'error', P2: 'warning', P3: 'archived', P4: 'archived' } as const;

/**
 * Work order priority P1–P4. Only the two priorities that demand action carry colour; P3 and P4
 * stay neutral, and P4 is outlined so the scale still reads as four steps without colour.
 */
export function PriorityBadge({ priority, showMeaning = false }: PriorityBadgeProps) {
  return (
    <Badge
      data-slot="priority-badge"
      data-priority={priority}
      variant={VARIANT[priority]}
      outline={priority === 'P4'}
      background={priority !== 'P4'}
      aria-label={`Priority ${priority}, ${priorityMeaning(priority).toLowerCase()}`}
    >
      {showMeaning ? `${priority} · ${priorityMeaning(priority)}` : priority}
    </Badge>
  );
}
