/** One editable key and value. The id stays the same while the key is retyped. */
export type KeyValuePair = { id: string; key: string; value: string };

/** Keys that appear more than once, compared without case or surrounding space. Blank keys are skipped. */
export function duplicateKeys(pairs: readonly KeyValuePair[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const pair of pairs) {
    const key = pair.key.trim().toLowerCase();
    if (key === '') continue;
    if (seen.has(key)) repeated.add(key);
    seen.add(key);
  }
  return [...repeated];
}
