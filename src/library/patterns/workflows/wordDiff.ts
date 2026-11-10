/** Word-level text diff: which words stayed, which were added and which were removed. */

export type DiffSegment = { type: 'same' | 'added' | 'removed'; text: string };

const words = (text: string): string[] => text.split(/\s+/).filter((word) => word !== '');

function push(segments: DiffSegment[], type: DiffSegment['type'], word: string): void {
  const last = segments[segments.length - 1];
  if (last && last.type === type) last.text = `${last.text} ${word}`;
  else segments.push({ type, text: word });
}

/**
 * Compares two texts word by word (longest common subsequence) and returns runs of unchanged,
 * removed and added words in reading order. Within a change, removals come before additions.
 * Whitespace differences are ignored.
 */
export function wordDiff(before: string, after: string): DiffSegment[] {
  const a = words(before);
  const b = words(after);
  // lengths[i][j] = length of the longest common subsequence of a[i..] and b[j..].
  const lengths = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(segments, 'same', a[i]);
      i += 1;
      j += 1;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      push(segments, 'removed', a[i]);
      i += 1;
    } else {
      push(segments, 'added', b[j]);
      j += 1;
    }
  }
  for (; i < a.length; i += 1) push(segments, 'removed', a[i]);
  for (; j < b.length; j += 1) push(segments, 'added', b[j]);
  return segments;
}

/** Number of words added and removed. */
export function diffStats(segments: readonly DiffSegment[]): { added: number; removed: number } {
  const count = (type: DiffSegment['type']) =>
    segments.filter((segment) => segment.type === type).reduce((total, segment) => total + words(segment.text).length, 0);
  return { added: count('added'), removed: count('removed') };
}
