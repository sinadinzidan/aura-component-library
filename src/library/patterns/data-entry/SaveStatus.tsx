import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import { IconAlertTriangle, IconCheck } from '@cognite/aura/icons';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type SaveStatusProps = {
  state: SaveState;
  /** Shown while nothing has been saved yet in this session. Leave out to show nothing. */
  idleText?: string;
  savingText?: string;
  savedText?: string;
  errorText?: string;
  /** Adds a "Retry" button to the error state. */
  onRetry?: () => void;
};

/**
 * The quiet indicator next to something that saves on change: "Saving…", then "Saved", or an
 * error with Retry. It replaces a toast per save and is announced politely.
 */
export function SaveStatus({
  state,
  idleText,
  savingText = 'Saving…',
  savedText = 'Saved',
  errorText = "Couldn't save",
  onRetry,
}: SaveStatusProps) {
  return (
    <div className="flex min-h-6 items-center gap-2 text-sm" data-state={state}>
      <output aria-live="polite" className="flex items-center gap-1.5">
        {state === 'saving' ? (
          <>
            <Loader size={14} aria-hidden />
            <span className="text-muted-foreground">{savingText}</span>
          </>
        ) : null}
        {state === 'saved' ? (
          <>
            <IconCheck aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{savedText}</span>
          </>
        ) : null}
        {state === 'error' ? (
          <>
            <IconAlertTriangle aria-hidden="true" className="size-4 text-critical-foreground-strong" />
            <span className="text-critical-foreground-strong">{errorText}</span>
          </>
        ) : null}
        {state === 'idle' && idleText ? <span className="text-muted-foreground">{idleText}</span> : null}
      </output>
      {state === 'error' && onRetry ? (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
