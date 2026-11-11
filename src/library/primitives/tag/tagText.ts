/** Splits typed or pasted text into tags on commas and line breaks, trimming and dropping empties and repeats. */
export function splitTagText(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const tag = part.trim().replace(/\s+/g, ' ');
    const key = tag.toLowerCase();
    if (tag === '' || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

/**
 * Adds `incoming` to `tags`. Stops at the first tag that is a duplicate, over the limit or
 * rejected by `validate`, and says why; tags before it are kept.
 */
export function addTags(
  tags: readonly string[],
  incoming: readonly string[],
  options: { maxTags?: number; validate?: (tag: string, tags: readonly string[]) => string | null } = {}
): { tags: string[]; error: string | null } {
  const next = [...tags];
  for (const tag of incoming) {
    if (options.maxTags !== undefined && next.length >= options.maxTags) {
      return { tags: next, error: `Up to ${options.maxTags} tags. Remove one to add another.` };
    }
    if (next.some((current) => current.toLowerCase() === tag.toLowerCase())) {
      return { tags: next, error: `“${tag}” is already added.` };
    }
    const message = options.validate?.(tag, next) ?? null;
    if (message !== null) return { tags: next, error: message };
    next.push(tag);
  }
  return { tags: next, error: null };
}
