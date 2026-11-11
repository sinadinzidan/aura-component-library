import { useId, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';

import { Tag } from './Tag';
import { addTags, splitTagText } from './tagText';
import type { TagVariant } from './tagVariants';

export type TagInputProps = {
  tags: readonly string[];
  onChange: (tags: string[]) => void;
  /** Accessible name of the text field: "Labels". */
  label: string;
  /** Id of the text field, so a `Label htmlFor` can point at it. */
  id?: string;
  placeholder?: string;
  /** Largest number of tags. The field says how many are used and stops taking more. */
  maxTags?: number;
  /** Return a message to reject a new tag, or `null` to accept it. Runs after the built-in checks. */
  validate?: (tag: string, tags: readonly string[]) => string | null;
  variant?: TagVariant;
  /** Monospace, for asset tags and identifiers. */
  mono?: boolean;
  disabled?: boolean;
};

/**
 * A text field that turns what is typed into tags: Enter or a comma adds, Backspace in the empty
 * field removes the last one, and a pasted comma-separated list becomes several. Duplicates and
 * tags past the limit are refused with a reason instead of silently dropped.
 */
export function TagInput({
  tags,
  onChange,
  label,
  id,
  placeholder = 'Add a tag',
  maxTags,
  validate,
  variant,
  mono = false,
  disabled = false,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const helperId = useId();
  const full = maxTags !== undefined && tags.length >= maxTags;

  const commit = (text: string): boolean => {
    const result = addTags(tags, splitTagText(text), { maxTags, validate });
    if (result.tags.length !== tags.length) onChange(result.tags);
    setError(result.error);
    return result.error === null;
  };

  const helper =
    error ??
    (maxTags === undefined ? null : full ? `${tags.length} of ${maxTags} tags. Remove one to add another.` : `${tags.length} of ${maxTags} tags`);

  return (
    <div className="flex w-full min-w-0 flex-col" data-slot="tag-input">
      {/* The wrapper is the visual field; clicking its padding puts the caret in the input. */}
      <div
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus();
        }}
        className={cn(
          'flex min-h-9 w-full min-w-0 cursor-text flex-wrap items-center gap-1 rounded-lg border px-1.5 py-1 transition-shadow',
          disabled
            ? 'cursor-not-allowed border-disabled bg-transparent'
            : 'border-transparent bg-medium-background focus-within:bg-base-background focus-within:shadow-focus-ring hover:border-emphasized focus-within:hover:border-transparent'
        )}
      >
        {tags.map((tag) => (
          <Tag
            key={tag}
            variant={variant}
            mono={mono}
            disabled={disabled}
            onRemove={() => {
              onChange(tags.filter((current) => current !== tag));
              setError(null);
              inputRef.current?.focus();
            }}
          >
            {tag}
          </Tag>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          aria-label={label}
          aria-invalid={error !== null ? true : undefined}
          aria-describedby={helper !== null ? helperId : undefined}
          disabled={disabled}
          readOnly={full}
          placeholder={full ? '' : placeholder}
          value={draft}
          className={cn(
            'h-6 min-w-24 flex-1 bg-transparent px-0.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            mono && 'font-mono'
          )}
          onChange={(event) => {
            const text = event.target.value;
            setError(null);
            // A comma or a pasted list commits everything before the last separator.
            if (/[,\n]/.test(text)) {
              const tail = text.slice(Math.max(text.lastIndexOf(','), text.lastIndexOf('\n')) + 1);
              const head = text.slice(0, text.length - tail.length);
              setDraft(commit(head) ? tail.trimStart() : text.replace(/[,\n]+$/, ''));
              return;
            }
            setDraft(text);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (draft.trim() !== '' && commit(draft)) setDraft('');
            }
            if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
              onChange(tags.slice(0, -1));
              setError(null);
            }
          }}
        />
      </div>
      <p
        id={helperId}
        role={error !== null ? 'alert' : undefined}
        className={cn('pt-1.5 text-xs tabular-nums empty:hidden', error !== null ? 'text-critical-foreground-strong' : 'text-muted-foreground')}
      >
        {helper}
      </p>
    </div>
  );
}
