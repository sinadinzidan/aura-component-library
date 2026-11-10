import { Input } from '@cognite/aura/components/input';
import { IconPencil } from '@cognite/aura/icons';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type EditableCellProps = {
  value: string;
  /** Called with the trimmed text when an edit is committed and the text changed. */
  onSave: (value: string) => void;
  /** Names what is being edited, including the row: "High limit for 23-PT-92531". */
  label: string;
  /** Return a message to block saving, or `null` when the text is fine. */
  validate?: (value: string) => string | null;
  /** Unit printed after the value in read mode and after the field in edit mode. */
  unit?: string;
  /** `end` right-aligns numbers so the decimals line up down a column. */
  align?: 'start' | 'end';
  inputMode?: 'text' | 'decimal' | 'numeric';
  /** Replaces the plain text in read mode, for example a formatted number. */
  display?: ReactNode;
  /**
   * Starts the cell open with this unsaved text, already validated. Use it to bring back an edit
   * that a failed save or a reload interrupted. Focus is not moved on mount.
   */
  defaultDraft?: string;
};

const acceptAnything = () => null;

/**
 * A table cell that edits in place: it reads as plain text, opens an input on click, Enter or F2,
 * commits on Enter or when focus leaves, and discards on Escape. An invalid value keeps the cell
 * open with a message, so nothing wrong is saved silently.
 */
export function EditableCell({
  value,
  onSave,
  label,
  validate = acceptAnything,
  unit,
  align = 'start',
  inputMode = 'text',
  display,
  defaultDraft,
}: EditableCellProps) {
  const [editing, setEditing] = useState(defaultDraft !== undefined);
  const [draft, setDraft] = useState(defaultDraft ?? value);
  const [error, setError] = useState<string | null>(() =>
    defaultDraft === undefined ? null : validate(defaultDraft.trim())
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const skipFocus = useRef(defaultDraft !== undefined);
  const errorId = useId();

  useEffect(() => {
    if (skipFocus.current) {
      // A restored draft must not pull focus to itself when the page loads.
      skipFocus.current = false;
      return;
    }
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const commit = (returnFocus: boolean) => {
    const next = draft.trim();
    const message = validate(next);
    if (message !== null) {
      setError(message);
      return;
    }
    if (next !== value) onSave(next);
    restoreFocus.current = returnFocus;
    setEditing(false);
  };

  const cancel = () => {
    restoreFocus.current = true;
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Edit ${label}, ${value}${unit ? ` ${unit}` : ''}`}
        className={`group/cell flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-base-foreground outline-none hover:bg-medium-background focus-visible:shadow-focus-ring ${
          align === 'end' ? 'flex-row-reverse text-right tabular-nums' : 'text-left'
        }`}
        onClick={start}
        onKeyDown={(event) => {
          if (event.key === 'F2') start();
        }}
      >
        <span className="min-w-0 truncate">
          {display ?? value}
          {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
        </span>
        <IconPencil
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100"
        />
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          className={align === 'end' ? 'w-full text-right' : 'w-full'}
          aria-label={label}
          aria-invalid={error !== null ? true : undefined}
          aria-describedby={error !== null ? errorId : undefined}
          inputMode={inputMode}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onBlur={() => commit(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              // Focus returns to the cell on save; stop the same key press from reopening it.
              event.preventDefault();
              commit(true);
            }
            if (event.key === 'Escape') cancel();
          }}
        />
        {unit ? <span className="shrink-0 text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      <p id={errorId} role="alert" className="pt-1 text-xs text-critical-foreground-strong empty:hidden">
        {error}
      </p>
    </div>
  );
}
