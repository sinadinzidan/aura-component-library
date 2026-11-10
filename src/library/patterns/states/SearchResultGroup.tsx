import { Button } from '@cognite/aura/components/button';
import { useId } from 'react';
import type { ReactNode } from 'react';

export type SearchResult = {
  id: string;
  /** The name people recognise the result by. */
  title: string;
  /** Where the match was found or what the result belongs to: "Gas compression · 1st stage compressor". */
  context?: string;
  /** Short trailing fact, such as a tag, a unit or a date. */
  meta?: string;
  icon?: ReactNode;
};

type SearchResultGroupProps = {
  /** The kind of thing in this group: "Assets", "Time series", "Documents". */
  heading: string;
  /** Total matches of this kind, when more exist than are listed. */
  total?: number;
  results: readonly SearchResult[];
  onSelect: (id: string) => void;
  /** When given and `total` exceeds the listed rows, a "View all" action appears in the heading. */
  onViewAll?: () => void;
};

const COUNT = new Intl.NumberFormat('en-US');

/**
 * One kind of result in a grouped search: a heading with the match count, the top rows as buttons,
 * and a way to see the rest. Each row says what it is and where it lives, so a match is
 * recognisable without highlighting.
 */
export function SearchResultGroup({ heading, total, results, onSelect, onViewAll }: SearchResultGroupProps) {
  const headingId = useId();
  const count = total ?? results.length;
  const hasMore = count > results.length;

  if (results.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex w-full flex-col gap-1">
      <header className="flex min-h-7 items-center justify-between gap-4 px-2">
        <h4 id={headingId} className="text-xs font-medium text-muted-foreground">
          {heading} <span className="font-normal tabular-nums">· {COUNT.format(count)}</span>
        </h4>
        {hasMore && onViewAll ? (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all<span className="sr-only"> {heading.toLowerCase()}</span>
          </Button>
        ) : null}
      </header>
      <ul className="flex flex-col">
        {results.map((result) => (
          <li key={result.id}>
            <button
              type="button"
              onClick={() => onSelect(result.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-accent-background focus-visible:shadow-focus-ring"
            >
              {result.icon ? (
                <span aria-hidden className="flex shrink-0 text-muted-foreground [&>svg]:size-4">
                  {result.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm text-base-foreground">{result.title}</span>
                {result.context ? (
                  <span className="truncate text-xs text-muted-foreground">{result.context}</span>
                ) : null}
              </span>
              {result.meta ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{result.meta}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
