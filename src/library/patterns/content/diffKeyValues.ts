export type KeyValueChange = 'added' | 'removed' | 'changed' | 'unchanged';

export type KeyValueDiffRow = {
  key: string;
  before?: string;
  after?: string;
  change: KeyValueChange;
};

function has(record: Readonly<Record<string, string>>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/**
 * Compares two flat records key by key. Keys keep the order of the earlier version, with new
 * keys after them, so a reviewer reads the diff in the order they know the record.
 */
export function diffKeyValues(before: Readonly<Record<string, string>>, after: Readonly<Record<string, string>>): KeyValueDiffRow[] {
  const keys = [...Object.keys(before), ...Object.keys(after).filter((key) => !has(before, key))];

  return keys.map((key): KeyValueDiffRow => {
    const inBefore = has(before, key);
    const inAfter = has(after, key);
    if (inBefore && !inAfter) return { key, before: before[key], change: 'removed' };
    if (!inBefore && inAfter) return { key, after: after[key], change: 'added' };
    return {
      key,
      before: before[key],
      after: after[key],
      change: before[key] === after[key] ? 'unchanged' : 'changed',
    };
  });
}

/** How many keys were added, removed and changed. */
export function countChanges(rows: readonly KeyValueDiffRow[]): Record<KeyValueChange, number> {
  const counts: Record<KeyValueChange, number> = {
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
  };
  for (const row of rows) counts[row.change] += 1;
  return counts;
}
