import { IconX } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { qualityStatus } from '../status';
import type { SignalQuality } from '../status';
import { StatusDot } from '../StatusDot';

export type TagChipProps = {
  /** Instrument or equipment tag, e.g. "23-PT-92531". */
  tag: string;
  /** Adds a quality dot in front of the tag. */
  quality?: SignalQuality;
  /** Makes the chip a button, e.g. to open the tag. */
  onSelect?: () => void;
  /** Adds a remove button. */
  onRemove?: () => void;
  className?: string;
};

const FOCUS = 'focus-visible:shadow-focus-ring focus-visible:outline-none';

/**
 * A tag as a compact monospace chip: inline in text, in a selection, or as a link to the tag.
 * Optional quality dot (named for assistive technology), optional select and remove actions.
 */
export function TagChip({ tag, quality, onSelect, onRemove, className }: TagChipProps) {
  const status = quality ? qualityStatus(quality) : undefined;
  const content = (
    <>
      {status ? <StatusDot size="sm" tone={status.tone} shape={status.shape} label={`${status.label} quality`} /> : null}
      <span>{tag}</span>
    </>
  );
  return (
    <span
      data-slot="tag-chip"
      className={cn(
        'inline-flex h-6 max-w-full items-center gap-1 rounded-md bg-muted-background px-1.5 font-mono text-xs whitespace-nowrap text-base-foreground',
        className
      )}
    >
      {onSelect ? (
        <button type="button" onClick={onSelect} className={cn('inline-flex items-center gap-1.5 rounded-xs hover:underline', FOCUS)}>
          {content}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5">{content}</span>
      )}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${tag}`}
          onClick={onRemove}
          className={cn('inline-flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:text-base-foreground', FOCUS)}
        >
          <IconX aria-hidden className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
