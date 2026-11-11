import type { ReactNode } from 'react';

import { suggestionOptionId } from './triggers';
import type { Suggestion } from './triggers';

type SuggestionListProps = {
  /** Id of the list element, for `aria-controls` on the field that owns it. */
  id: string;
  /** What is being picked: "People", "Asset tags". */
  label: string;
  suggestions: readonly Suggestion[];
  /** Index of the highlighted row. */
  activeIndex: number;
  onPick: (suggestion: Suggestion) => void;
  onActiveChange?: (index: number) => void;
  /** Leading mark for a row, for example an avatar. */
  renderLeading?: (suggestion: Suggestion) => ReactNode;
  /** Shown when nothing matches. */
  emptyText?: string;
  /** Detail text in monospace, for tags and IDs. */
  monoLabel?: boolean;
};

/**
 * The list a `@` or `#` lookup shows: a listbox whose highlighted row is driven by the text
 * field, so focus never leaves the text. Rows are picked with the pointer here and with Enter
 * or Tab from the field.
 */
export function SuggestionList({
  id,
  label,
  suggestions,
  activeIndex,
  onPick,
  onActiveChange,
  renderLeading,
  emptyText = 'No matches',
  monoLabel = false,
}: SuggestionListProps) {
  return (
    <div className="flex w-64 max-w-full flex-col rounded-lg border border-default bg-popover-background p-1 shadow-default">
      <span className="px-2 py-1 text-xs font-medium text-muted-foreground">{label}</span>
      {suggestions.length === 0 ? (
        <span className="px-2 py-1.5 text-sm text-muted-foreground">{emptyText}</span>
      ) : (
        <ul id={id} role="listbox" aria-label={label} className="flex flex-col">
          {suggestions.map((suggestion, index) => {
            const active = index === activeIndex;
            return (
              <li
                key={suggestion.id}
                id={suggestionOptionId(id, index)}
                role="option"
                aria-selected={active}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-base-foreground ${active ? 'bg-medium-background' : ''}`}
                // Keep focus in the text field: the pick happens on pointer down, before blur.
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(suggestion);
                }}
                onMouseEnter={() => onActiveChange?.(index)}
              >
                {renderLeading?.(suggestion)}
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate ${monoLabel ? 'font-mono text-xs' : 'font-medium'}`}>{suggestion.label}</span>
                  {suggestion.detail ? <span className="truncate text-xs text-muted-foreground">{suggestion.detail}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
