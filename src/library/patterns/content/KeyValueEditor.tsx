import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { IconPlus, IconTrash } from '@cognite/aura/icons';
import { useEffect, useId, useRef } from 'react';

import { IconAction } from '../collections/IconAction';

import { duplicateKeys } from './duplicateKeys';
import type { KeyValuePair } from './duplicateKeys';

type KeyValueEditorProps = {
  /** Accessible name of the group: "Metadata". */
  label: string;
  pairs: readonly KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  /** Verb + object: "Add property". */
  addLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** Largest number of pairs. The add button is disabled with a reason at this count. */
  maxPairs?: number;
  /** Makes the id of a new pair. Injectable so ids can come from the caller's own scheme. */
  createId?: () => string;
};

/**
 * Free-form key and value pairs edited as rows: change either side in place, remove a row, add
 * one at the end. Keys are monospace because they are identifiers. A key used twice is marked on
 * every row that has it, since the editor cannot know which one is the mistake.
 */
export function KeyValueEditor({
  label,
  pairs,
  onChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  addLabel = 'Add property',
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  maxPairs,
  createId,
}: KeyValueEditorProps) {
  // Id of a row that was just added and should take focus once it is rendered.
  const pendingFocus = useRef<string | null>(null);
  const counter = useRef(0);
  const group = useRef<HTMLDivElement>(null);
  const messageId = useId();
  const repeated = duplicateKeys(pairs);
  const full = maxPairs !== undefined && pairs.length >= maxPairs;

  useEffect(() => {
    if (pendingFocus.current === null) return;
    group.current?.querySelector<HTMLInputElement>(`[data-pair="${pendingFocus.current}"]`)?.focus();
    pendingFocus.current = null;
  }, [pairs]);

  const nextId = (): string => {
    if (createId) return createId();
    let candidate: string;
    do {
      counter.current += 1;
      candidate = `pair-${counter.current}`;
    } while (pairs.some((pair) => pair.id === candidate));
    return candidate;
  };

  const update = (id: string, patch: Partial<KeyValuePair>) =>
    onChange(pairs.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)));

  const add = () => {
    const id = nextId();
    pendingFocus.current = id;
    onChange([...pairs, { id, key: '', value: '' }]);
  };

  const message =
    repeated.length > 0
      ? `${repeated.length === 1 ? 'Key' : 'Keys'} used more than once: ${repeated.join(', ')}. Each key needs its own name.`
      : null;

  return (
    <div ref={group} role="group" aria-label={label} data-slot="key-value-editor" className="flex w-full min-w-0 flex-col gap-2">
      {pairs.length > 0 ? (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-x-2 gap-y-2">
          <span className="text-xs font-medium text-muted-foreground">{keyLabel}</span>
          <span className="text-xs font-medium text-muted-foreground">{valueLabel}</span>
          <span aria-hidden="true" className="w-7" />
          {pairs.map((pair, index) => {
            const name = pair.key.trim() === '' ? `row ${index + 1}` : pair.key.trim();
            const invalid = repeated.includes(pair.key.trim().toLowerCase());
            return (
              <div key={pair.id} className="contents">
                <div className="min-w-0 font-mono">
                  <Input
                    data-pair={pair.id}
                    aria-label={`${keyLabel}, row ${index + 1}`}
                    aria-invalid={invalid ? true : undefined}
                    aria-describedby={invalid ? messageId : undefined}
                    placeholder={keyPlaceholder}
                    value={pair.key}
                    onChange={(event) => update(pair.id, { key: event.target.value })}
                  />
                </div>
                <Input
                  aria-label={`${valueLabel} for ${name}`}
                  placeholder={valuePlaceholder}
                  value={pair.value}
                  onChange={(event) => update(pair.id, { value: event.target.value })}
                />
                <IconAction label={`Remove ${name}`} onClick={() => onChange(pairs.filter((current) => current.id !== pair.id))}>
                  <IconTrash />
                </IconAction>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No properties yet.</p>
      )}
      <p id={messageId} role="alert" className="text-sm text-critical-foreground-strong empty:hidden">
        {message}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" disabled={full} onClick={add}>
          <IconPlus /> {addLabel}
        </Button>
        {full ? <span className="text-xs text-muted-foreground">Up to {maxPairs} properties. Remove one to add another.</span> : null}
      </div>
    </div>
  );
}
