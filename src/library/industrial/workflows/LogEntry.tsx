import { IconAlertTriangle, IconBox, IconChecks, IconClipboardList, IconPinned } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { LogCategoryBadge } from './LogCategoryBadge';
import type { LogCategory } from './LogCategoryBadge';

export type LogLinkKind = 'asset' | 'alarm' | 'work-order';

export type LogLink = { kind: LogLinkKind; label: string };

export type LogEntryProps = {
  /** Time of the entry as shown, e.g. "13:46". */
  time: string;
  author: string;
  category: LogCategory;
  /** The entry text. */
  children: ReactNode;
  /** What the entry is about: an asset, an alarm, a work order. */
  links?: readonly LogLink[];
  /** A standing instruction that stays at the top across shifts. */
  pinned?: boolean;
  /** Who on the incoming shift has read it. */
  acknowledgedBy?: string;
  /** Under the entry: a comment thread or actions. */
  footer?: ReactNode;
  className?: string;
};

const LINK_ICON = { asset: IconBox, alarm: IconAlertTriangle, 'work-order': IconClipboardList } as const;
const LINK_WORD: Record<LogLinkKind, string> = { asset: 'Asset', alarm: 'Alarm', 'work-order': 'Work order' };

/**
 * One shift log entry: when, who, what kind, and the text — with optional links to the asset,
 * alarm or work order it concerns, a pinned mark and an acknowledgement line.
 */
export function LogEntry({ time, author, category, children, links, pinned = false, acknowledgedBy, footer, className }: LogEntryProps) {
  return (
    <article data-slot="log-entry" data-pinned={pinned ? 'true' : undefined} className={cn('grid w-full grid-cols-[3rem_minmax(0,1fr)] gap-x-3', className)}>
      <time className="pt-0.5 text-xs text-muted-foreground tabular-nums">{time}</time>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-base-foreground">{author}</span>
          <LogCategoryBadge category={category} />
          {pinned ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <IconPinned aria-hidden className="size-3.5" />
              Standing instruction
            </span>
          ) : null}
        </div>
        <div className="text-sm text-base-foreground">{children}</div>
        {links && links.length > 0 ? (
          <ul aria-label="Linked items" className="flex flex-wrap gap-2">
            {links.map((link) => {
              const Icon = LINK_ICON[link.kind];
              return (
                <li key={`${link.kind}-${link.label}`} className="inline-flex h-6 items-center gap-1.5 rounded-md bg-muted-background px-1.5 text-xs text-base-foreground">
                  <Icon aria-hidden className="size-3.5 text-muted-foreground" />
                  <span className="sr-only">{LINK_WORD[link.kind]}: </span>
                  <span className="font-mono">{link.label}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
        {acknowledgedBy ? (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <IconChecks aria-hidden className="size-3.5" />
            Acknowledged by {acknowledgedBy}
          </p>
        ) : null}
        {footer}
      </div>
    </article>
  );
}
