import { Button } from '@cognite/aura/components/button';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconCheck, IconPencil, IconRefresh, IconTrash } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

export type DraftReviewProps = {
  /** What was drafted: "Work order description". Labels the draft and the editor. */
  label: string;
  /** The generated text. A new value replaces any edits. */
  draft: string;
  /** Called with the text as it stands, including the reader's edits. */
  onAccept: (text: string) => void;
  onDiscard: () => void;
  /** Shows "Regenerate" when given. */
  onRegenerate?: () => void;
  acceptLabel?: string;
  /** Quiet line under the draft: what it was based on, or that it needs checking. */
  footnote?: ReactNode;
};

/**
 * A generated draft that a person must accept, edit or discard before it is used. Nothing is
 * applied until Accept; editing happens in place and marks the draft as edited, so it is clear
 * the text that gets accepted is no longer exactly what the model wrote.
 */
export function DraftReview({ label, draft, onAccept, onDiscard, onRegenerate, acceptLabel = 'Accept draft', footnote }: DraftReviewProps) {
  const id = useId();
  const [text, setText] = useState(draft);
  const [pending, setPending] = useState(draft);
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(draft);

  // A new draft replaces the text and any edits; resetting during render avoids a stale frame.
  if (source !== draft) {
    setSource(draft);
    setText(draft);
    setPending(draft);
    setEditing(false);
  }

  const edited = text !== draft;

  if (editing) {
    return (
      <div data-slot="draft-review" data-mode="editing" className="flex w-full min-w-0 flex-col gap-3">
        <div className="flex flex-col">
          <Label htmlFor={id}>{label}</Label>
          <Textarea id={id} rows={5} value={pending} onChange={(event) => setPending(event.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={pending.trim() === ''}
            onClick={() => {
              setText(pending);
              setEditing(false);
            }}
          >
            Save edits
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPending(text);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-slot="draft-review" data-mode="review" className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{edited ? 'Draft, edited by you' : 'Draft, not saved'}</span>
      </div>
      <p data-slot="draft-text" className="rounded-lg bg-muted-background p-3 text-sm whitespace-pre-wrap text-base-foreground">
        {text}
      </p>
      {footnote ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => onAccept(text)}>
          <IconCheck /> {acceptLabel}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <IconPencil /> Edit
        </Button>
        {onRegenerate ? (
          <Button variant="ghost" size="sm" onClick={onRegenerate}>
            <IconRefresh /> Regenerate
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onDiscard}>
          <IconTrash /> Discard
        </Button>
      </div>
    </div>
  );
}
