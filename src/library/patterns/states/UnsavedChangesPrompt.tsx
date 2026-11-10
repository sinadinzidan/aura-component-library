import { Button } from '@cognite/aura/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import { Loader } from '@cognite/aura/components/loader';
import { useState } from 'react';

type UnsavedChangesPromptProps = {
  open: boolean;
  /** Called with `false` when the user chooses to stay, presses Escape or clicks outside. */
  onOpenChange: (open: boolean) => void;
  /** Names what is being left: "Leave alarm rule without saving?". */
  title?: string;
  /** What is lost, as specifically as the caller can say it. */
  description?: string;
  /** Throws the changes away and continues to where the user was going. */
  onDiscard: () => void;
  /** When given, a third action saves first and then continues. May return a promise. */
  onSave?: () => void | Promise<void>;
  stayLabel?: string;
  discardLabel?: string;
  saveLabel?: string;
};

/**
 * The guard shown when someone is about to leave a form with unsaved edits. Staying is the safe
 * default and the easiest exit; discarding is named for what it does; saving first is offered when
 * the caller can do it. While a save is in flight the prompt cannot be dismissed.
 */
export function UnsavedChangesPrompt({
  open,
  onOpenChange,
  title = 'Leave without saving?',
  description = "Your changes haven't been saved. If you leave now, they are lost.",
  onDiscard,
  onSave,
  stayLabel = 'Keep editing',
  discardLabel = 'Discard changes',
  saveLabel = 'Save and leave',
}: UnsavedChangesPromptProps) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const changeOpen = (next: boolean) => {
    if (saving) return;
    if (!next) setFailed(false);
    onOpenChange(next);
  };

  const save = () => {
    if (!onSave || saving) return;
    setFailed(false);
    const result = onSave();
    if (!(result instanceof Promise)) return;
    setSaving(true);
    result.then(
      () => setSaving(false),
      () => {
        setSaving(false);
        setFailed(true);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {failed ? (
          <p role="alert" className="pt-2 text-sm text-critical-foreground-strong">
            Couldn&apos;t save your changes. Try again, or keep editing.
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" disabled={saving} onClick={() => changeOpen(false)}>
            {stayLabel}
          </Button>
          <Button variant={onSave ? 'secondary' : 'destructive'} disabled={saving} onClick={onDiscard}>
            {discardLabel}
          </Button>
          {onSave ? (
            <Button disabled={saving} aria-busy={saving || undefined} onClick={save}>
              {saving ? <Loader size={16} aria-hidden /> : null}
              {saveLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
