import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCheck } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type NotificationItemProps = {
  /** Verb-first headline: "Recompressor tripped", "Aisha Khan mentioned you". */
  title: string;
  /** One line of context. Clamped to two lines. */
  description?: string;
  /** Where and when: "Gas compression · 14 min ago". */
  meta: string;
  /** Leading avatar or icon tile that says what kind of notification this is. */
  media?: ReactNode;
  /** A Badge beside the title, for example an alarm severity. */
  label?: ReactNode;
  unread?: boolean;
  /** Makes the row a button that opens what the notification is about. */
  onOpen?: () => void;
  /** Shows a "Mark as read" control while the row is unread. */
  onMarkRead?: () => void;
  /** Inline actions under the text, such as Acknowledge or Reply. */
  actions?: ReactNode;
};

/**
 * One row of an inbox. Unread rows carry a dot and a stronger title, so read state never depends
 * on colour alone; the row opens its subject, and marking as read is a separate, labelled control.
 */
export function NotificationItem({
  title,
  description,
  meta,
  media,
  label,
  unread = false,
  onOpen,
  onMarkRead,
  actions,
}: NotificationItemProps) {
  const text = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`min-w-0 truncate text-sm ${unread ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}
        >
          {title}
        </span>
        {label}
      </span>
      {description ? <span className="line-clamp-2 text-sm text-muted-foreground">{description}</span> : null}
      <span className="text-xs text-muted-foreground">{meta}</span>
    </>
  );

  return (
    <li
      data-unread={unread || undefined}
      className="group/notification flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent-background"
    >
      <span className={`flex w-2 shrink-0 justify-center ${media ? 'pt-3.5' : 'pt-1.5'}`}>
        {unread ? (
          <span className="size-2 rounded-full bg-primary-background">
            <span className="sr-only">Unread</span>
          </span>
        ) : null}
      </span>
      {media ? <span className="flex size-9 shrink-0 items-center justify-center">{media}</span> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 cursor-pointer flex-col gap-1 rounded-md text-left outline-none focus-visible:shadow-focus-ring"
          >
            {text}
          </button>
        ) : (
          <div className="flex min-w-0 flex-col gap-1">{text}</div>
        )}
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {unread && onMarkRead ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Mark "${title}" as read`} onClick={onMarkRead}>
                <IconCheck />
              </Button>
            }
          />
          <TooltipContent>Mark as read</TooltipContent>
        </Tooltip>
      ) : null}
    </li>
  );
}
