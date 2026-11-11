import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';

import { IconAction } from '../../patterns/collections/IconAction';

import type { QueryDataset, SavedQuery } from './queryModel';
import { QueryChips } from './QuerySummary';

type SavedQueriesProps = {
  queries: readonly SavedQuery[];
  datasets: readonly QueryDataset[];
  /** Id of the query that matches what is on screen, if any. */
  activeId?: string;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  /** Saves the current query under a name. Leave out to hide the form. */
  onSave?: (name: string) => void;
  /** Disables saving and says why, e.g. while the query has incomplete conditions. */
  saveDisabledReason?: string;
};

/** Named queries to return to: each shows its chips, loads with one click and can be deleted. */
export function SavedQueries({ queries, datasets, activeId, onLoad, onDelete, onSave, saveDisabledReason }: SavedQueriesProps) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <div data-slot="saved-queries" className="flex w-full min-w-0 flex-col gap-3">
      {onSave ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed === '' || saveDisabledReason) return;
            onSave(trimmed);
            setName('');
          }}
        >
          <Input aria-label="Query name" placeholder="Name this query" value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" variant="secondary" disabled={trimmed === '' || saveDisabledReason !== undefined}>
            Save query
          </Button>
        </form>
      ) : null}
      {saveDisabledReason ? <p className="text-xs text-muted-foreground">{saveDisabledReason}</p> : null}
      {queries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved queries yet. Name the current query to keep it.</p>
      ) : (
        <ul aria-label="Saved queries" className="flex flex-col divide-y divide-default">
          {queries.map((query) => {
            const dataset = datasets.find((entry) => entry.id === query.datasetId);
            return (
              <li key={query.id} className="flex items-start gap-3 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-base-foreground">{query.name}</span>
                    {query.id === activeId ? <span className="text-xs text-muted-foreground">Open</span> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{dataset?.label ?? query.datasetId}</span>
                  {dataset ? <QueryChips root={query.root} fields={dataset.fields} noun={dataset.noun} /> : null}
                </div>
                <Button variant="secondary" size="sm" aria-label={`Load ${query.name}`} disabled={query.id === activeId} onClick={() => onLoad(query.id)}>
                  Load
                </Button>
                <IconAction label={`Delete ${query.name}`} onClick={() => onDelete(query.id)}>
                  <IconTrash />
                </IconAction>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
