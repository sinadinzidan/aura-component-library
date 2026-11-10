/** Turns a typed sentence into structured filters by matching a known vocabulary. Pure and deterministic. */

export type FilterTerm = {
  /** The filtered property: "Severity". */
  property: string;
  /** The value to apply: "Critical". */
  value: string;
  /** Words or phrases that mean this value, lower case: ["critical", "urgent"]. */
  phrases: readonly string[];
};

export type ParsedFilter = { property: string; value: string; matched: string };

export type ParsedQuery = {
  filters: ParsedFilter[];
  /** What was left after removing the matched phrases; treat it as free-text search. */
  rest: string;
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches whole phrases, longest first, so "last 24 hours" wins over "24". Each property is
 * applied at most once (the first value found wins), and matched phrases are removed from the
 * remainder. Matching ignores case.
 */
export function parseFilterQuery(query: string, vocabulary: readonly FilterTerm[]): ParsedQuery {
  const candidates = vocabulary
    .flatMap((term) => term.phrases.map((phrase) => ({ term, phrase: phrase.trim().toLowerCase() })))
    .filter((candidate) => candidate.phrase !== '')
    .sort((a, b) => b.phrase.length - a.phrase.length);

  let rest = ` ${query} `;
  const found: (ParsedFilter & { index: number })[] = [];

  for (const { term, phrase } of candidates) {
    if (found.some((filter) => filter.property === term.property)) continue;
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(phrase)})(?=$|[^\\p{L}\\p{N}])`, 'iu');
    const match = pattern.exec(rest);
    if (!match) continue;
    const start = match.index + match[1].length;
    found.push({ property: term.property, value: term.value, matched: match[2], index: start });
    rest = `${rest.slice(0, start)}${' '.repeat(match[2].length)}${rest.slice(start + match[2].length)}`;
  }

  return {
    filters: found.sort((a, b) => a.index - b.index).map(({ property, value, matched }) => ({ property, value, matched })),
    rest: rest.replace(/\s+/g, ' ').trim(),
  };
}
