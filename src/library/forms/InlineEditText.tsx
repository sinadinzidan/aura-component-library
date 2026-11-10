import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { IconCheck, IconPencil, IconX } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';

type InlineEditTextProps = {
  value: string;
  /** Called with the trimmed text when the edit is saved and the text changed. */
  onSave: (value: string) => void;
  /** Names what is being edited, e.g. "dashboard name". Used for accessible names. */
  label: string;
  /** Return a message to block saving, or `null` when the text is fine. */
  validate?: (value: string) => string | null;
};

const requireText = (value: string) => (value === '' ? 'Enter a value.' : null);

/**
 * Text that turns into an input in place. Enter or the check saves, Escape or the cross cancels,
 * and focus returns to the edit button so keyboard users keep their place.
 */
export function InlineEditText({ value, onSave, label, validate = requireText }: InlineEditTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const stop = () => {
    restoreFocus.current = true;
    setEditing(false);
  };

  const save = () => {
    const next = draft.trim();
    const message = validate(next);
    if (message !== null) {
      setError(message);
      return;
    }
    if (next !== value) onSave(next);
    stop();
  };

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate text-sm font-medium text-base-foreground">{value}</span>
        <Button ref={editButtonRef} variant="ghost" size="icon-sm" aria-label={`Edit ${label}`} onClick={start}>
          <IconPencil />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          aria-label={label}
          aria-invalid={error !== null ? true : undefined}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              // Focus moves to the edit button on save; stop the same key press from activating it.
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') stop();
          }}
        />
        <Button variant="ghost" size="icon" aria-label={`Save ${label}`} onClick={save}>
          <IconCheck />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Cancel editing" onClick={stop}>
          <IconX />
        </Button>
      </div>
      <p role="alert" className="pt-2 text-sm text-critical-foreground-strong empty:hidden">
        {error}
      </p>
    </div>
  );
}
