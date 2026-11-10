import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';

type SaveBarProps = {
  /** Number of unsaved changes. The bar is hidden at 0 unless `cleanText` is set. */
  dirtyCount: number;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel?: string;
  discardLabel?: string;
  /** True while the save is in flight: both buttons are locked and the save button shows a loader. */
  saving?: boolean;
  /** Shown instead of the count when the last save failed. Say what to do next. */
  error?: string;
  /** Shown with no buttons while there is nothing to save, such as "All changes saved". */
  cleanText?: string;
  /** Builds the count text. */
  formatCount?: (count: number) => string;
};

const defaultFormatCount = (count: number) => (count === 1 ? '1 unsaved change' : `${count} unsaved changes`);

/**
 * The explicit-save bar for a settings page or an edited table: it appears with the number of
 * unsaved changes and offers Discard and Save. Use it when changes should be applied together;
 * use save-on-change for independent switches.
 */
export function SaveBar({
  dirtyCount,
  onSave,
  onDiscard,
  saveLabel = 'Save changes',
  discardLabel = 'Discard',
  saving = false,
  error,
  cleanText,
  formatCount = defaultFormatCount,
}: SaveBarProps) {
  const dirty = dirtyCount > 0;
  if (!dirty && cleanText === undefined) return null;

  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      data-dirty={dirty ? 'true' : 'false'}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-lg bg-muted-background px-4 py-2"
    >
      <p
        role="status"
        className={`min-w-0 text-sm ${error && dirty ? 'text-critical-foreground-strong' : dirty ? 'font-medium text-base-foreground' : 'text-muted-foreground'}`}
      >
        {dirty ? (error ?? formatCount(dirtyCount)) : cleanText}
      </p>
      {dirty ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" disabled={saving} onClick={onDiscard}>
            {discardLabel}
          </Button>
          <Button aria-busy={saving || undefined} disabled={saving} onClick={onSave}>
            {saving ? <Loader size={16} aria-hidden /> : null}
            {saveLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
