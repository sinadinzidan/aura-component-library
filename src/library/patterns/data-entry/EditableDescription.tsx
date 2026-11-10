import { Button } from '@cognite/aura/components/button';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconPencil } from '@cognite/aura/icons';
import { useEffect, useId, useRef, useState } from 'react';

import { ShortcutHint } from '../../actions/ShortcutHint';
import type { ShortcutPlatform } from '../../actions/ShortcutHint';

type EditableDescriptionProps = {
  value: string;
  /** Called with the trimmed text when the edit is saved and the text changed. */
  onSave: (value: string) => void;
  /** Names what is being edited: "work order description". */
  label: string;
  /** Shown in read mode while the value is empty. */
  emptyText?: string;
  rows?: number;
  /** Hard limit on the length; the remaining count is shown while editing. */
  maxLength?: number;
  /** Fixes the modifier key shown in the hint. Defaults to the platform the app runs on. */
  platform?: ShortcutPlatform;
};

/**
 * A paragraph that turns into a textarea in place. Because Enter makes a new line, saving is
 * Ctrl/⌘ + Enter or the Save button, Escape cancels, and the keys are spelled out under the field.
 */
export function EditableDescription({
  value,
  onSave,
  label,
  emptyText = 'No description',
  rows = 4,
  maxLength,
  platform,
}: EditableDescriptionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const hintId = useId();

  useEffect(() => {
    if (editing) {
      const textarea = textareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  const stop = () => {
    restoreFocus.current = true;
    setEditing(false);
  };

  const save = () => {
    const next = draft.trim();
    if (next !== value) onSave(next);
    stop();
  };

  if (!editing) {
    return (
      <div className="flex w-full items-start justify-between gap-3">
        <p
          className={`min-w-0 whitespace-pre-line text-sm ${value === '' ? 'text-muted-foreground' : 'text-base-foreground'}`}
        >
          {value === '' ? emptyText : value}
        </p>
        <Button
          ref={editButtonRef}
          variant="ghost"
          size="sm"
          aria-label={`Edit ${label}`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          <IconPencil /> Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Textarea
        ref={textareaRef}
        aria-label={label}
        aria-describedby={hintId}
        rows={rows}
        maxLength={maxLength}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            save();
          }
          if (event.key === 'Escape') stop();
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div id={hintId} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShortcutHint keys={['mod', 'enter']} platform={platform} /> to save
          </span>
          <span className="flex items-center gap-1">
            <ShortcutHint keys={['esc']} platform={platform} /> to cancel
          </span>
          {maxLength === undefined ? null : (
            <span className="tabular-nums">
              {draft.length}/{maxLength}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={stop}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
