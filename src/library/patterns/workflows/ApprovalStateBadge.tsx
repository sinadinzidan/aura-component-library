import { Badge } from '@cognite/aura/components/badge';
import { IconCircleCheck, IconCircleX, IconClock, IconClockOff, IconMessage } from '@cognite/aura/icons';

import { approvalStateLabel } from './approvalState';
import type { ApprovalState } from './approvalState';

const STATES = {
  pending: { variant: 'inProgress', Icon: IconClock },
  approved: { variant: 'success', Icon: IconCircleCheck },
  rejected: { variant: 'error', Icon: IconCircleX },
  'changes-requested': { variant: 'warning', Icon: IconMessage },
  expired: { variant: 'archived', Icon: IconClockOff },
} as const;

export type ApprovalStateBadgeProps = {
  state: ApprovalState;
  /** Overrides the default word, for example "Awaiting you". */
  label?: string;
};

/**
 * Where an approval request stands. Each state has its own icon and word, so the five states stay
 * apart without colour; only the outcomes that need a reaction are coloured.
 */
export function ApprovalStateBadge({ state, label }: ApprovalStateBadgeProps) {
  const { variant, Icon } = STATES[state];
  return (
    <Badge variant={variant} data-state={state}>
      <Icon aria-hidden="true" />
      {label ?? approvalStateLabel(state)}
    </Badge>
  );
}
