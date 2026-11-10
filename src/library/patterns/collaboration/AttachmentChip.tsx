import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconPaperclip, IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type AttachmentChipProps = {
  /** File name with its extension. */
  name: string;
  /** Size as shown: "2.4 MB". */
  size?: string;
  /** Icon for the kind of file. A paperclip when left out. */
  icon?: ReactNode;
  /** Makes the name a button that opens or downloads the file. */
  onOpen?: () => void;
  /** Adds a remove button, for attachments on a comment that has not been posted yet. */
  onRemove?: () => void;
};

/**
 * One file attached to a comment or message: kind icon, name and size on a single line. The name
 * truncates in the middle of a crowded row, the size never does.
 */
export function AttachmentChip({ name, size, icon, onOpen, onRemove }: AttachmentChipProps) {
  const label = (
    <>
      <span aria-hidden="true" className="flex shrink-0 text-muted-foreground [&>svg]:size-4">
        {icon ?? <IconPaperclip />}
      </span>
      <span className="min-w-0 truncate text-base-foreground">{name}</span>
    </>
  );

  return (
    <span
      data-slot="attachment"
      className="inline-flex h-7 max-w-full min-w-0 items-center gap-2 rounded-lg border border-default pr-2 pl-2 text-sm"
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${name}`}
          className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md outline-none hover:underline focus-visible:shadow-focus-ring"
        >
          {label}
        </button>
      ) : (
        <span className="flex min-w-0 items-center gap-2">{label}</span>
      )}
      {size ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{size}</span> : null}
      {onRemove ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} onClick={onRemove} className="-mr-2">
                <IconX />
              </Button>
            }
          />
          <TooltipContent>Remove attachment</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}
