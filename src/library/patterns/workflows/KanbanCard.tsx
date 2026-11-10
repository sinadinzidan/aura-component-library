import { Progress } from '@cognite/aura/components/progress';
import { IconBan, IconGripVertical } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../display/PersonAvatar';

export type KanbanCardPerson = { id: string; name: string; initials?: string };

export type KanbanCardProps = {
  /** Reference shown in monospace above the title: "WO-104482". */
  reference: string;
  title: string;
  /** One quiet line under the title, such as the equipment. */
  description?: ReactNode;
  /** Sits beside the reference, usually a priority badge. */
  badge?: ReactNode;
  /** Why the card cannot move on. Shows a "Blocked" line with an icon. */
  blockedReason?: string;
  /** 0–100. Shows a progress bar with the figure. */
  progress?: number;
  /** Start of the footer: a due date or a count. */
  meta?: ReactNode;
  /** Shows the avatar at the end of the footer. `null` prints "Unassigned"; leave out to hide it. */
  assignee?: KanbanCardPerson | null;
  /** Controls at the end of the header, such as `KanbanMoveControls`. */
  actions?: ReactNode;
  /** `compact` keeps only reference, title and actions, for long columns. */
  density?: 'default' | 'compact';
  /** Shows a grip, the look of a draggable card. Decorative: moving is done through `actions`. */
  grip?: boolean;
  /** Makes the title a button that opens the card. */
  onOpen?: () => void;
  /** The card is the one open in a detail panel. */
  selected?: boolean;
};

/**
 * One card on a board: reference and badge on top, the job, then what holds it up, how far it is
 * and who has it. Sits on the column surface as a bordered base-colour tile. A blocked card says
 * so in words with an icon, never by colour alone.
 */
export function KanbanCard({
  reference,
  title,
  description,
  badge,
  blockedReason,
  progress,
  meta,
  assignee,
  actions,
  density = 'default',
  grip = false,
  onOpen,
  selected = false,
}: KanbanCardProps) {
  const compact = density === 'compact';
  const hasFooter = !compact && (meta !== undefined || assignee !== undefined);

  return (
    <article
      data-slot="kanban-card"
      data-blocked={blockedReason ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      aria-label={`${reference} ${title}`}
      className={`flex w-full min-w-0 flex-col rounded-lg border bg-base-background ${compact ? 'gap-1 p-2' : 'gap-2 p-3'} ${
        selected ? 'border-emphasized' : 'border-default'
      }`}
    >
      <div className="flex min-h-7 items-center gap-2">
        {grip ? <IconGripVertical aria-hidden="true" data-slot="kanban-card-grip" className="-ml-1 size-4 shrink-0 text-muted-foreground" /> : null}
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{reference}</span>
        {badge}
        {actions ? <span className="-mr-1 ml-auto flex shrink-0 items-center">{actions}</span> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        {onOpen ? (
          <button
            type="button"
            aria-current={selected ? 'true' : undefined}
            className="cursor-pointer rounded-sm text-left text-sm font-medium text-base-foreground outline-none hover:underline focus-visible:shadow-focus-ring"
            onClick={onOpen}
          >
            {title}
          </button>
        ) : (
          <p className="text-sm font-medium text-base-foreground">{title}</p>
        )}
        {description && !compact ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      {blockedReason ? (
        <p className="flex items-start gap-1.5 text-xs text-warning-foreground-strong">
          <IconBan aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-medium">Blocked</span> · {blockedReason}
          </span>
        </p>
      ) : null}

      {progress !== undefined && !compact ? (
        <div className="flex items-center gap-3">
          <Progress value={progress} size="sm" aria-label={`${reference} progress`} className="flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
        </div>
      ) : null}

      {hasFooter ? (
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">{meta}</span>
          {assignee ? (
            <PersonAvatar name={assignee.name} initials={assignee.initials} colorKey={assignee.id} sizes="xsm" />
          ) : assignee === null ? (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
