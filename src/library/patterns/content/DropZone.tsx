import { IconUpload } from '@cognite/aura/icons';
import { useId, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import { FilePickerButton } from './FilePickerButton';

type DropZoneProps = {
  /** Accessible name of the region: "Upload engineering documents". */
  label: string;
  /** Called with dropped or picked files. Validate them in the handler. */
  onFiles: (files: File[]) => void;
  /** The invitation. */
  title?: string;
  /** What is accepted: types and size limit. */
  hint?: ReactNode;
  browseLabel?: string;
  /** Passed to the file dialog. Dropped files are not filtered by it. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Why uploading is off and what unblocks it. Shown instead of the hint while disabled. */
  disabledReason?: string;
  /** Forces the drag-over look, for documentation and tests. */
  dragging?: boolean;
  /** `compact` is one row high, for a zone above a list or inside a form. */
  density?: 'default' | 'compact';
};

/**
 * A drop target for files with a button that does the same job, so uploading never depends on
 * drag and drop. It shows when a drag is over it, and when it is off it says why. It only hands
 * files over; validation, the queue and progress belong to the caller.
 */
export function DropZone({
  label,
  onFiles,
  title = 'Drop files here',
  hint,
  browseLabel = 'Browse files',
  accept,
  multiple = true,
  disabled = false,
  disabledReason,
  dragging,
  density = 'default',
}: DropZoneProps) {
  const [over, setOver] = useState(false);
  // Enter and leave also fire for every child the pointer crosses; the zone is left at depth 0.
  const depth = useRef(0);
  const hintId = useId();
  const active = !disabled && (dragging ?? over);
  const compact = density === 'compact';
  const helper = disabled && disabledReason ? disabledReason : hint;

  const enter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    depth.current += 1;
    if (!disabled) setOver(true);
  };

  const leave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    depth.current = 0;
    setOver(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    const accepted = multiple ? files : files.slice(0, 1);
    if (accepted.length > 0) onFiles(accepted);
  };

  const surface = disabled
    ? 'border-dashed border-disabled'
    : active
      ? 'border-solid border-emphasized bg-medium-background'
      : 'border-dashed border-emphasized';

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={helper ? hintId : undefined}
      aria-disabled={disabled || undefined}
      data-slot="drop-zone"
      data-dragging={active || undefined}
      onDragEnter={enter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={leave}
      onDrop={drop}
      className={`flex w-full min-w-0 rounded-xl border transition-colors ${surface} ${
        compact ? 'flex-wrap items-center gap-3 px-4 py-3' : 'flex-col items-center gap-3 px-6 py-8 text-center'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:size-5 ${
          disabled
            ? 'bg-muted-background text-base-foreground-disabled'
            : active
              ? 'bg-primary-background text-primary-foreground'
              : 'bg-medium-background text-medium-foreground'
        }`}
      >
        <IconUpload />
      </span>
      <div className={`flex min-w-0 flex-col gap-1 ${compact ? 'flex-1 basis-48' : ''}`}>
        <p className={`text-sm font-medium ${disabled ? 'text-base-foreground-disabled' : 'text-base-foreground'}`} aria-live="polite">
          {active ? 'Release to upload' : title}
        </p>
        {helper ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {helper}
          </p>
        ) : null}
      </div>
      <FilePickerButton
        onFiles={onFiles}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        size={compact ? 'sm' : 'default'}
        inputLabel={`${browseLabel} for ${label}`}
      >
        {browseLabel}
      </FilePickerButton>
    </div>
  );
}
