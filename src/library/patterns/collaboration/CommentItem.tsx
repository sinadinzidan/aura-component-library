import { IconMessageOff } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../display/PersonAvatar';

type CommentItemProps = {
  /** Who wrote it. Also names the comment for assistive tech. */
  author: string;
  /** Stable key for the avatar colour, usually the user id. */
  colorKey?: string;
  /** Quiet text after the name: a role or "Author". */
  authorDetail?: string;
  /** When it was posted, already formatted: "14 min ago". */
  time: string;
  /** Adds "Edited" after the time. */
  edited?: boolean;
  /** Replaces the body with a tombstone so replies keep their place in the thread. */
  deleted?: boolean;
  /** Text of the tombstone. */
  deletedText?: string;
  /** A badge on the header line: "Pinned", "Resolved". */
  badge?: ReactNode;
  /** Header controls at the far end, such as an overflow menu. */
  actions?: ReactNode;
  /** The comment text. Plain text and `MentionChip`s. */
  children?: ReactNode;
  /** Files under the text, as `AttachmentChip`s. */
  attachments?: ReactNode;
  /** The row under the comment: reactions and Reply. */
  footer?: ReactNode;
  /** Replies, as more `CommentItem`s. They indent under this comment's text and get a thread line. */
  replies?: ReactNode;
  /** `compact` uses a smaller avatar, for replies and narrow panels. */
  size?: 'default' | 'compact';
};

/**
 * One comment: avatar, author and time on one line, the text under it, then attachments, the
 * reaction row and any replies. Replies nest one level and are joined by a thread line, so who
 * answers whom is carried by position. A deleted comment leaves a tombstone, not a hole.
 */
export function CommentItem({
  author,
  colorKey,
  authorDetail,
  time,
  edited = false,
  deleted = false,
  deletedText = 'This comment was deleted.',
  badge,
  actions,
  children,
  attachments,
  footer,
  replies,
  size = 'default',
}: CommentItemProps) {
  const compact = size === 'compact';

  return (
    <article
      data-slot="comment"
      data-deleted={deleted || undefined}
      aria-label={deleted ? 'Deleted comment' : `Comment by ${author}`}
      className="flex w-full min-w-0 gap-3"
    >
      <div className="flex shrink-0 flex-col items-center gap-2">
        {deleted ? (
          <span
            aria-hidden="true"
            className={`flex items-center justify-center rounded-lg bg-muted-background text-muted-foreground ${compact ? 'size-6 [&>svg]:size-3.5' : 'size-9 [&>svg]:size-4'}`}
          >
            <IconMessageOff />
          </span>
        ) : (
          <PersonAvatar name={author} colorKey={colorKey} sizes={compact ? 'xsm' : 'default'} />
        )}
        {replies ? <span aria-hidden="true" data-slot="thread-line" className="w-0 flex-1 border-l border-emphasized" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          {deleted ? (
            <p className={`text-sm text-muted-foreground ${compact ? 'leading-6' : 'pt-2'}`}>
              {deletedText} <span className="tabular-nums">{time}</span>
            </p>
          ) : (
            <>
              <div className={`flex min-w-0 items-center gap-2 ${compact ? 'min-h-6' : 'min-h-5'}`}>
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-base-foreground">{author}</span>
                  {authorDetail ? <span className="text-xs text-muted-foreground">{authorDetail}</span> : null}
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {time}
                    {edited ? ' · Edited' : ''}
                  </span>
                </span>
                {badge ? <span className="flex shrink-0 items-center">{badge}</span> : null}
                {actions ? <span className="-my-1 ml-auto flex shrink-0 items-center gap-1">{actions}</span> : null}
              </div>
              {children ? <div className="text-sm leading-6 text-base-foreground">{children}</div> : null}
            </>
          )}
        </div>
        {attachments && !deleted ? <div className="flex min-w-0 flex-wrap gap-2">{attachments}</div> : null}
        {footer && !deleted ? <div className="flex min-w-0 flex-wrap items-center gap-2">{footer}</div> : null}
        {replies ? (
          <div data-slot="comment-replies" className="flex flex-col gap-4 pt-2">
            {replies}
          </div>
        ) : null}
      </div>
    </article>
  );
}
