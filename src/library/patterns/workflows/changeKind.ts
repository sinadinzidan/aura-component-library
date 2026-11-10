/** How one line of a comparison differs between its two sides. */
export type ChangeKind = 'added' | 'removed' | 'changed' | 'unchanged';

const LABEL: Record<ChangeKind, string> = { added: 'Added', removed: 'Removed', changed: 'Changed', unchanged: 'Unchanged' };

/** The word for a kind of change. */
export const changeLabel = (kind: ChangeKind): string => LABEL[kind];

/** How a value differs between two sides: missing on one side, different, or the same. */
export function changeBetween(before: string | undefined, after: string | undefined): ChangeKind {
  if (before === undefined && after !== undefined) return 'added';
  if (before !== undefined && after === undefined) return 'removed';
  return before === after ? 'unchanged' : 'changed';
}

/** How many lines there are of each kind. Every kind is present, zero included. */
export function countChangeKinds(kinds: readonly ChangeKind[]): Record<ChangeKind, number> {
  const counts: Record<ChangeKind, number> = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  for (const kind of kinds) counts[kind] += 1;
  return counts;
}
