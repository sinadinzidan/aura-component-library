export type ExpiryState = 'active' | 'expiring-soon' | 'expired' | 'revoked' | 'no-expiry';

export type ExpiryInput = {
  /** Epoch milliseconds, or `null` for a credential that never expires. */
  expiresAt: number | null;
  /** Epoch milliseconds when it was revoked. Revoked wins over every other state. */
  revokedAt?: number | null;
  /** The current time, passed in so the result is deterministic and testable. */
  now: number;
  /** How many days before expiry the state turns to "expiring soon". */
  soonWithinDays?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const EXPIRY_LABELS: Record<ExpiryState, string> = {
  active: 'Active',
  'expiring-soon': 'Expiring soon',
  expired: 'Expired',
  revoked: 'Revoked',
  'no-expiry': 'No expiry',
};

/** Which lifecycle state a key, token or temporary grant is in at `now`. */
export function getExpiryState({ expiresAt, revokedAt = null, now, soonWithinDays = 14 }: ExpiryInput): ExpiryState {
  if (revokedAt !== null && revokedAt <= now) return 'revoked';
  if (expiresAt === null) return 'no-expiry';
  if (expiresAt <= now) return 'expired';
  if (expiresAt - now <= soonWithinDays * DAY_MS) return 'expiring-soon';
  return 'active';
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** A whole-unit distance between two times: "5 hours", "1 day", "12 days". */
function distance(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return 'less than an hour';
  if (hours < 24) return plural(hours, 'hour');
  return plural(Math.floor(ms / DAY_MS), 'day');
}

/** The sentence beside the badge: "Expires in 6 days", "Expired 3 days ago", "Revoked 1 day ago". */
export function describeExpiry(input: ExpiryInput): string {
  const { expiresAt, revokedAt = null, now } = input;
  const state = getExpiryState(input);

  if (state === 'revoked' && revokedAt !== null) return `Revoked ${distance(now - revokedAt)} ago`;
  if (state === 'no-expiry' || expiresAt === null) return 'Does not expire';
  if (state === 'expired') return `Expired ${distance(now - expiresAt)} ago`;
  return `Expires in ${distance(expiresAt - now)}`;
}
