import { Search } from '@cognite/aura/components/search';
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';

import { searchTags } from './pidModel';
import type { PidDrawing, PidTagKind, PidTagRef } from './pidModel';

export type PidTagSearchProps = {
  drawing: PidDrawing;
  /** A result was chosen: fly to it and select it. */
  onPick: (tag: PidTagRef) => void;
  /** Starts with this text in the field, results open. */
  defaultQuery?: string;
  limit?: number;
  /** `floating` drops the results over the canvas; `inline` keeps them in the flow of a panel. */
  results?: 'floating' | 'inline';
  placeholder?: string;
  className?: string;
};

const KIND_LABEL: Record<PidTagKind, string> = { equipment: 'Equipment', valve: 'Valve', instrument: 'Instrument' };

/**
 * Tag search for a drawing: type part of a tag or a name, move through the matches with the arrow
 * keys and press Enter to go there. Hyphens and case do not matter, so "pt92531" is enough.
 */
export function PidTagSearch({ drawing, onPick, defaultQuery = '', limit = 6, results = 'floating', placeholder = 'Find a tag', className }: PidTagSearchProps) {
  const listId = useId();
  const [query, setQuery] = useState(defaultQuery);
  const [open, setOpen] = useState(defaultQuery !== '');
  const [active, setActive] = useState(0);
  const matches = searchTags(drawing, query, limit);
  const showList = open && query.trim() !== '';
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1));

  const pick = (tag: PidTagRef) => {
    onPick(tag);
    setQuery(tag.tag);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The viewer listens for arrows and plus/minus; keys typed here stay here.
    event.stopPropagation();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showList) {
        setOpen(true);
        return;
      }
      if (matches.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      const match = matches[activeIndex];
      if (showList && match) {
        event.preventDefault();
        pick(match);
      }
    } else if (event.key === 'Escape') {
      if (showList) setOpen(false);
      else setQuery('');
    }
  };

  return (
    <div data-slot="pid-tag-search" className={cn('relative w-full min-w-0', className)}>
      <Search
        role="combobox"
        aria-label="Find a tag"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && matches[activeIndex] ? `${listId}-${matches[activeIndex].id}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onClear={() => setQuery('')}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {showList ? (
        <div
          className={cn(
            'rounded-lg border border-default bg-base-background p-1',
            results === 'floating' ? 'absolute top-full left-0 z-20 mt-1 w-full min-w-64' : 'mt-2'
          )}
        >
          <ul id={listId} role="listbox" aria-label="Matching tags" className="flex flex-col">
            {matches.map((tag, index) => (
              <li
                key={tag.id}
                id={`${listId}-${tag.id}`}
                role="option"
                aria-selected={index === activeIndex}
                // Keep focus in the field so the list does not close before the click lands.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => pick(tag)}
                onPointerEnter={() => setActive(index)}
                className={cn('flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5', index === activeIndex && 'bg-muted-background')}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-mono text-sm text-base-foreground">{tag.tag}</span>
                  <span className="truncate text-xs text-muted-foreground">{tag.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{KIND_LABEL[tag.kind]}</span>
              </li>
            ))}
          </ul>
          {matches.length === 0 ? (
            <p role="status" className="px-2 py-1.5 text-sm text-muted-foreground">
              No tag on this drawing matches “{query.trim()}”.
            </p>
          ) : null}
        </div>
      ) : (
        <span id={listId} role="listbox" aria-label="Matching tags" className="hidden" />
      )}
    </div>
  );
}
