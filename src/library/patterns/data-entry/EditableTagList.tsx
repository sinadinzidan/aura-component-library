import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { IconPlus, IconX } from '@cognite/aura/icons';
import { useEffect, useId, useRef, useState } from 'react';

type EditableTagListProps = {
  tags: readonly string[];
  onChange: (tags: string[]) => void;
  /** Accessible name of the list: "Labels". */
  label: string;
  /** Verb + object for the add button and the input: "Add label". */
  addLabel?: string;
  /** Return a message to reject a new tag, or `null` to accept it. Runs after the built-in checks. */
  validate?: (tag: string, tags: readonly string[]) => string | null;
  /** Largest number of tags. The add button is replaced by a note at this count. */
  maxTags?: number;
};

const acceptAnything = () => null;

/**
 * Tags that are edited where they are shown: each has a remove button, and "Add" opens a small
 * input in the same row. Enter adds and keeps the input open for the next tag, Escape closes it,
 * and empty or duplicate tags are rejected with a reason.
 */
export function EditableTagList({
  tags,
  onChange,
  label,
  addLabel = 'Add tag',
  validate = acceptAnything,
  maxTags,
}: EditableTagListProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const errorId = useId();
  const atMaximum = maxTags !== undefined && tags.length >= maxTags;

  useEffect(() => {
    if (adding) inputRef.current?.focus();
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      addButtonRef.current?.focus();
    }
  }, [adding]);

  const close = () => {
    restoreFocus.current = true;
    setDraft('');
    setError(null);
    setAdding(false);
  };

  const add = () => {
    const next = draft.trim();
    if (next === '') {
      close();
      return;
    }
    const duplicate = tags.some((tag) => tag.toLowerCase() === next.toLowerCase());
    const message = duplicate ? `“${next}” is already added.` : validate(next, tags);
    if (message !== null) {
      setError(message);
      return;
    }
    onChange([...tags, next]);
    setDraft('');
    setError(null);
    if (maxTags !== undefined && tags.length + 1 >= maxTags) close();
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        {tags.length > 0 ? (
          <ul aria-label={label} className="flex min-w-0 list-none flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="inline-flex h-7 max-w-full items-center gap-1 rounded-md bg-medium-background pl-2 pr-1 text-sm text-base-foreground"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-medium-background-hover hover:text-base-foreground focus-visible:shadow-focus-ring"
                  onClick={() => onChange(tags.filter((current) => current !== tag))}
                >
                  <IconX aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {adding ? (
          <Input
            ref={inputRef}
            className="w-36"
            aria-label={addLabel}
            aria-invalid={error !== null ? true : undefined}
            aria-describedby={error !== null ? errorId : undefined}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onBlur={() => {
              if (draft.trim() === '') close();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
              if (event.key === 'Escape') close();
            }}
          />
        ) : atMaximum ? (
          <span className="text-xs text-muted-foreground">Up to {maxTags}.</span>
        ) : (
          <Button ref={addButtonRef} variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <IconPlus /> {addLabel}
          </Button>
        )}
      </div>
      <p id={errorId} role="alert" className="pt-2 text-sm text-critical-foreground-strong empty:hidden">
        {error}
      </p>
    </div>
  );
}
