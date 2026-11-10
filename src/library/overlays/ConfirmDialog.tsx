import { Button } from '@cognite/aura/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the object and the action: "Delete 23-KA-9103?". */
  title: string;
  /** The consequence and whether it can be undone. */
  description: ReactNode;
  /** The specific action, such as "Delete asset". Never "OK" or "Confirm". */
  confirmLabel: string;
  cancelLabel?: string;
  /** Label of the confirm button while `onConfirm` is in flight. */
  pendingLabel?: string;
  /** Uses the destructive button for the confirming action. */
  destructive?: boolean;
  /** When set, the confirm button unlocks only after the user types this exact text. */
  confirmText?: string;
  /** Shown under the footer when `onConfirm` rejects. The dialog stays open so the user can retry. */
  errorMessage?: string;
  /** May return a promise; the dialog stays open and cannot be dismissed until it settles. */
  onConfirm: () => void | Promise<void>;
};

/**
 * A confirmation dialog for one consequential action. It optionally asks the user to type the
 * object's name first, blocks every way of closing while the action is in flight, and closes
 * itself when the action succeeds.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  pendingLabel,
  destructive = false,
  confirmText,
  errorMessage = 'Something went wrong. Try again.',
  onConfirm,
}: ConfirmDialogProps) {
  const inputId = useId();
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const unlocked = confirmText === undefined || typed.trim() === confirmText;

  const changeOpen = (next: boolean) => {
    if (pending) return;
    if (!next) {
      setTyped('');
      setFailed(false);
    }
    onOpenChange(next);
  };

  const finish = () => {
    setPending(false);
    setTyped('');
    onOpenChange(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!unlocked || pending) return;
    setFailed(false);
    const result = onConfirm();
    if (!(result instanceof Promise)) {
      finish();
      return;
    }
    setPending(true);
    result.then(finish, () => {
      setPending(false);
      setFailed(true);
    });
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {confirmText !== undefined ? (
            <div className="pt-2">
              <Label htmlFor={inputId}>
                <span>
                  Type <span className="font-semibold text-base-foreground">{confirmText}</span> to confirm
                </span>
              </Label>
              <Input
                id={inputId}
                value={typed}
                autoComplete="off"
                spellCheck={false}
                disabled={pending}
                onChange={(event) => setTyped(event.target.value)}
              />
            </div>
          ) : null}
          {failed ? (
            <HelperText isError role="alert">
              {errorMessage}
            </HelperText>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => changeOpen(false)}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={destructive ? 'destructive' : 'default'}
              disabled={!unlocked || pending}
              aria-busy={pending || undefined}
            >
              {pending ? <Loader size={16} aria-hidden /> : null}
              {pending && pendingLabel ? pendingLabel : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
