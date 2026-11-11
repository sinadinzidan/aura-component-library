import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { IconAlertTriangle, IconCircleCheck, IconTrash } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { IconAction } from '../../patterns/collections/IconAction';

import type { HistoryEntry, Snippet } from './workbenchState';

const firstLine = (sql: string): string => sql.split('\n').find((line) => line.trim() !== '' && !line.trim().startsWith('--'))?.trim() ?? sql.trim();

type QueryHistoryListProps = {
  /** Newest first. */
  entries: readonly HistoryEntry[];
  /** Called with the query text to load it back into the editor. */
  onPick: (sql: string) => void;
  onClear?: () => void;
};

/** Earlier runs, newest first, each with its outcome in words and an icon. A row loads the query. */
export function QueryHistoryList({ entries, onPick, onClear }: QueryHistoryListProps) {
  if (entries.length === 0) return <p className="px-1 text-sm text-muted-foreground">Queries you run appear here. Run one with Ctrl+Enter.</p>;
  return (
    <div className="flex min-h-0 flex-col gap-2" data-slot="query-history">
      <ul className="flex min-h-0 flex-col overflow-y-auto">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button type="button" className="flex w-full min-w-0 flex-col gap-0.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-medium-background focus-visible:shadow-focus-ring" onClick={() => onPick(entry.sql)}>
              <span className="truncate font-mono text-xs text-base-foreground">{firstLine(entry.sql)}</span>
              <span className={`flex min-w-0 items-center gap-1 text-xs ${entry.ok ? 'text-muted-foreground' : 'text-critical-foreground-strong'}`}>
                {entry.ok ? <IconCircleCheck className="size-3.5 shrink-0" aria-hidden="true" /> : <IconAlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />}
                <span className="truncate">{entry.ok ? entry.summary : `Failed: ${entry.summary}`}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {onClear ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={onClear}>
          Clear history
        </Button>
      ) : null}
    </div>
  );
}

type SnippetListProps = {
  snippets: readonly Snippet[];
  onPick: (sql: string) => void;
  onRemove: (id: string) => void;
  /** Called with the name typed for the current query. Leave out to hide the save form. */
  onSave?: (name: string) => void;
  /** Disables saving, for example while the editor is empty. */
  canSave?: boolean;
};

/** Saved queries with a name, loaded by a click and removed with a labelled icon button. */
export function SnippetList({ snippets, onPick, onRemove, onSave, canSave = true }: SnippetListProps) {
  const id = useId();
  const [name, setName] = useState('');

  return (
    <div className="flex min-h-0 flex-col gap-3" data-slot="snippet-list">
      {onSave ? (
        <form
          className="flex flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            onSave(name);
            setName('');
          }}
        >
          <Label htmlFor={`${id}-name`}>Save current query</Label>
          <div className="flex items-center gap-2">
            <Input id={`${id}-name`} value={name} placeholder="Snippet name" onChange={(event) => setName(event.target.value)} />
            <Button type="submit" variant="secondary" disabled={!canSave}>
              Save
            </Button>
          </div>
        </form>
      ) : null}
      {snippets.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">No saved queries yet.</p>
      ) : (
        <ul className="flex min-h-0 flex-col overflow-y-auto">
          {snippets.map((snippet) => (
            <li key={snippet.id} className="flex items-center gap-1">
              <button type="button" className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-medium-background focus-visible:shadow-focus-ring" onClick={() => onPick(snippet.sql)}>
                <span className="truncate text-sm font-medium text-base-foreground">{snippet.name}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{firstLine(snippet.sql)}</span>
              </button>
              <IconAction label={`Delete snippet ${snippet.name}`} onClick={() => onRemove(snippet.id)}>
                <IconTrash />
              </IconAction>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
