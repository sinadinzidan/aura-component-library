import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconPencil } from '@cognite/aura/icons';
import { useEffect, useId, useRef, useState } from 'react';

type EditableTitleProps = {
  value: string;
  /** Called with the trimmed title when the edit is saved and the title changed. */
  onSave: (value: string) => void;
  /** Names what is being renamed: "dashboard". Used for accessible names and the empty-title message. */
  label: string;
  /** Return a message to block saving, or `null` when the title is fine. Runs after the empty check. */
  validate?: (value: string) => string | null;
  maxLength?: number;
};

const acceptAnything = () => null;

/**
 * A page or panel title that is renamed where it stands. The heading keeps its size and place;
 * a pencil button opens an input of the same width, Enter or leaving the field saves, Escape
 * cancels, and an empty or rejected title keeps the field open with a reason.
 */
export function EditableTitle({ value, onSave, label, validate = acceptAnything, maxLength = 80 }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const errorId = useId();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  const stop = (returnFocus: boolean) => {
    restoreFocus.current = returnFocus;
    setError(null);
    setEditing(false);
  };

  const save = (returnFocus: boolean) => {
    const next = draft.trim();
    const message = next === '' ? `Enter a name for the ${label}.` : validate(next);
    if (message !== null) {
      setError(message);
      return;
    }
    if (next !== value) onSave(next);
    stop(returnFocus);
  };

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <h2 className="truncate text-xl font-semibold text-base-foreground">{value}</h2>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                ref={editButtonRef}
                variant="ghost"
                size="icon-sm"
                aria-label={`Rename ${label}`}
                onClick={() => {
                  setDraft(value);
                  setEditing(true);
                }}
              >
                <IconPencil />
              </Button>
            }
          />
          <TooltipContent>Rename {label}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 max-w-md flex-col">
      <Input
        ref={inputRef}
        aria-label={`Name of the ${label}`}
        aria-invalid={error !== null ? true : undefined}
        aria-describedby={error !== null ? errorId : undefined}
        maxLength={maxLength}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onBlur={() => save(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            // Focus returns to the rename button on save; stop the same key press from activating it.
            event.preventDefault();
            save(true);
          }
          if (event.key === 'Escape') stop(true);
        }}
      />
      <p id={errorId} role="alert" className="pt-2 text-sm text-critical-foreground-strong empty:hidden">
        {error}
      </p>
    </div>
  );
}
