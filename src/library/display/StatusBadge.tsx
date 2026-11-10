import { Badge } from '@cognite/aura/components/badge';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconHexagon,
  IconInnerShadowTopLeft,
} from '@cognite/aura/icons';

/** Equipment run states and work order statuses the badge knows how to show. */
export type Status =
  | 'running'
  | 'standby'
  | 'stopped'
  | 'tripped'
  | 'maintenance'
  | 'open'
  | 'planned'
  | 'in-progress'
  | 'waiting'
  | 'done';

type Tone = 'success' | 'warning' | 'error' | 'inProgress' | 'archived';

const STATUSES: Record<Status, { label: string; tone: Tone }> = {
  running: { label: 'Running', tone: 'success' },
  standby: { label: 'Standby', tone: 'archived' },
  stopped: { label: 'Stopped', tone: 'archived' },
  tripped: { label: 'Tripped', tone: 'error' },
  maintenance: { label: 'Maintenance', tone: 'warning' },
  open: { label: 'Open', tone: 'archived' },
  planned: { label: 'Planned', tone: 'inProgress' },
  'in-progress': { label: 'In progress', tone: 'inProgress' },
  waiting: { label: 'Waiting', tone: 'warning' },
  done: { label: 'Done', tone: 'success' },
};

const ICONS: Record<Tone, typeof IconCircleCheck> = {
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  error: IconHexagon,
  inProgress: IconInnerShadowTopLeft,
  archived: IconCircleDashed,
};

type StatusBadgeProps = {
  status: Status;
  /** Overrides the default label, for example a translated one. */
  label?: string;
  /** The icon keeps the status readable without colour. Hide it only in very dense tables. */
  showIcon?: boolean;
  /** Quieter outlined style for rows where many badges repeat. */
  outline?: boolean;
};

/**
 * One place that decides which Badge variant, icon and label a status gets, so "Tripped" is
 * never red on one screen and amber on the next.
 */
export function StatusBadge({ status, label, showIcon = true, outline = false }: StatusBadgeProps) {
  const { label: defaultLabel, tone } = STATUSES[status];
  const Icon = ICONS[tone];

  return (
    <Badge variant={tone} outline={outline}>
      {showIcon ? <Icon aria-hidden="true" /> : null}
      {label ?? defaultLabel}
    </Badge>
  );
}
