import { Badge } from '@cognite/aura/components/badge';
import { IconAlertCircle, IconAlertOctagon, IconAlertTriangle, IconInfoCircle } from '@cognite/aura/icons';

import { severityStatus } from '../status';
import type { Severity } from '../status';

export type SeverityBadgeProps = {
  severity: Severity;
  /** Number of alarms of this severity. Reads "2 high" instead of "High". */
  count?: number;
  /** Overrides the severity word, for example a translated one. */
  label?: string;
  /** Quieter outlined style for rows where many badges repeat. */
  outline?: boolean;
};

const VARIANT = { critical: 'error', high: 'warning', medium: 'inProgress', low: 'archived' } as const;

const ICON: Record<Severity, typeof IconAlertCircle> = {
  critical: IconAlertOctagon,
  high: IconAlertTriangle,
  medium: IconAlertCircle,
  low: IconInfoCircle,
};

/**
 * Alarm severity as an Aura Badge: one variant, icon and word per severity, so "high" is the same
 * amber triangle on an asset card, a tree row and an alarm header. With `count` it becomes the
 * per-asset alarm badge.
 */
export function SeverityBadge({ severity, count, label, outline = false }: SeverityBadgeProps) {
  const word = label ?? severityStatus(severity).label;
  const Icon = ICON[severity];

  return (
    <Badge data-slot="severity-badge" data-severity={severity} variant={VARIANT[severity]} outline={outline}>
      <Icon aria-hidden="true" />
      {count === undefined ? word : `${count} ${word.toLowerCase()}`}
    </Badge>
  );
}
