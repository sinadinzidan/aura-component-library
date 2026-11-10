import { Badge } from '@cognite/aura/components/badge';
import { IconAlertTriangle, IconBan, IconCircleCheck, IconClock, IconInfinity } from '@cognite/aura/icons';

import { EXPIRY_LABELS, describeExpiry, getExpiryState } from './expiryState';
import type { ExpiryState } from './expiryState';

type ExpiryBadgeProps = {
  /** Epoch milliseconds, or `null` when the credential never expires. */
  expiresAt: number | null;
  revokedAt?: number | null;
  /** The current time. Passed in so the badge is deterministic; in an app, the clock you inject. */
  now: number;
  /** Days before expiry at which the badge turns to "Expiring soon". */
  soonWithinDays?: number;
  /** Adds the distance beside the badge: "Expires in 6 days". */
  showDetail?: boolean;
};

const VARIANTS = {
  active: 'success',
  'expiring-soon': 'warning',
  expired: 'error',
  revoked: 'archived',
  'no-expiry': 'secondary',
} as const satisfies Record<ExpiryState, string>;

const ICONS: Record<ExpiryState, typeof IconClock> = {
  active: IconCircleCheck,
  'expiring-soon': IconClock,
  expired: IconAlertTriangle,
  revoked: IconBan,
  'no-expiry': IconInfinity,
};

/**
 * The lifecycle state of a key, token or temporary grant as a badge: active, expiring soon,
 * expired, revoked or without expiry. One place decides the variant, icon and wording, so a key
 * never reads "Expiring soon" in a table and "Active" in its detail view.
 */
export function ExpiryBadge({ expiresAt, revokedAt, now, soonWithinDays, showDetail = false }: ExpiryBadgeProps) {
  const input = { expiresAt, revokedAt, now, soonWithinDays };
  const state = getExpiryState(input);
  const Icon = ICONS[state];

  return (
    <span className="inline-flex items-center gap-2">
      <Badge variant={VARIANTS[state]}>
        <Icon aria-hidden="true" />
        {EXPIRY_LABELS[state]}
      </Badge>
      {showDetail ? <span className="text-xs tabular-nums text-muted-foreground">{describeExpiry(input)}</span> : null}
    </span>
  );
}
