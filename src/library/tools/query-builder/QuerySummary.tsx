import { Badge } from '@cognite/aura/components/badge';

import { chipsOf, describeQuery } from './queryModel';
import type { Group, QueryField } from './queryModel';

type QuerySummaryProps = {
  root: Group;
  fields: readonly QueryField[];
  /** Plural noun the sentence starts with: "Work orders". */
  noun: string;
  /** How many incomplete conditions the sentence leaves out. */
  ignored?: number;
};

/** The query as one sentence. Incomplete conditions are left out and counted. */
export function QuerySentence({ root, fields, noun, ignored = 0 }: QuerySummaryProps) {
  return (
    <p data-slot="query-sentence" className="text-sm text-base-foreground">
      {describeQuery(root, fields, noun)}.
      {ignored > 0 ? <span className="ml-1 text-muted-foreground">{ignored === 1 ? '1 incomplete condition is ignored.' : `${ignored} incomplete conditions are ignored.`}</span> : null}
    </p>
  );
}

/** One chip per top-level part of the query, for a toolbar or a saved-query row. */
export function QueryChips({ root, fields, noun }: Omit<QuerySummaryProps, 'ignored'>) {
  const chips = chipsOf(root, fields);
  if (chips.length === 0) return <span className="text-xs text-muted-foreground">All {noun.toLowerCase()}</span>;
  return (
    <ul aria-label="Query summary" data-slot="query-chips" className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip, index) => (
        <li key={chip.id} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-xs text-muted-foreground">{root.combinator}</span> : null}
          <Badge variant="secondary">{chip.text}</Badge>
        </li>
      ))}
    </ul>
  );
}
