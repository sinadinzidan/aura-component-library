import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconAlertTriangle, IconChevronsLeft, IconChevronsRight, IconPlus } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { wipStatus } from './boardReducer';

export type KanbanColumnProps = {
  title: string;
  /** Number of cards in the column, also while it is collapsed. */
  count: number;
  /** Work-in-progress limit. The count reads "4 / 3" and a label appears at and over the limit. */
  limit?: number;
  /** The cards. */
  children?: ReactNode;
  /** Shown instead of the cards while there are none. */
  empty?: ReactNode;
  /** Adds an "Add card" button under the cards. */
  onAdd?: () => void;
  addLabel?: string;
  /** Hides the cards. */
  collapsed?: boolean;
  /** `rail` shrinks the column to a narrow strip; `summary` keeps the width and shows one line. */
  collapsedLayout?: 'rail' | 'summary';
  /** The line shown by a `summary` collapse, such as "12 closed this week". */
  collapsedSummary?: ReactNode;
  /** Adds the collapse and expand control. */
  onToggleCollapse?: () => void;
  /** Extra header controls before the collapse button. */
  actions?: ReactNode;
};

/**
 * One column of a board: a header with the stage name and its card count, the cards, and an
 * optional add button. A column over its WIP limit says so with an icon and words. Collapsing
 * keeps the name and count visible, so nothing disappears from the flow.
 */
export function KanbanColumn({
  title,
  count,
  limit,
  children,
  empty,
  onAdd,
  addLabel = 'Add card',
  collapsed = false,
  collapsedLayout = 'rail',
  collapsedSummary,
  onToggleCollapse,
  actions,
}: KanbanColumnProps) {
  const wip = wipStatus(count, limit);
  const countText = limit === undefined ? String(count) : `${count} / ${limit}`;
  const name = `${title}, ${count} ${count === 1 ? 'card' : 'cards'}`;

  if (collapsed && collapsedLayout === 'rail') {
    return (
      <section data-slot="kanban-column" data-collapsed="true" aria-label={name} className="flex w-10 shrink-0 flex-col items-center gap-2 rounded-xl bg-muted-background py-2">
        {onToggleCollapse ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={`Expand ${title}`} aria-expanded={false} onClick={onToggleCollapse}>
                  <IconChevronsRight />
                </Button>
              }
            />
            <TooltipContent>Expand {title}</TooltipContent>
          </Tooltip>
        ) : null}
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{count}</span>
        <h3 className="whitespace-nowrap text-sm font-medium text-base-foreground [writing-mode:vertical-rl]">{title}</h3>
      </section>
    );
  }

  return (
    <section data-slot="kanban-column" data-wip={wip} data-collapsed={collapsed ? 'true' : undefined} aria-label={name} className="flex w-full min-w-0 flex-col gap-2 rounded-xl bg-muted-background p-2">
      <header className="flex min-h-7 items-center gap-2 pl-1">
        <h3 className="truncate text-sm font-medium text-base-foreground">{title}</h3>
        <span data-slot="kanban-column-count" className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {countText}
        </span>
        {wip === 'over' && limit !== undefined ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-warning-foreground-strong">
            <IconAlertTriangle aria-hidden="true" className="size-3.5" />
            {count - limit} over limit
          </span>
        ) : null}
        {wip === 'at' ? <span className="shrink-0 text-xs text-muted-foreground">At limit</span> : null}
        {actions || onToggleCollapse ? (
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {actions}
            {onToggleCollapse ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
                      aria-expanded={!collapsed}
                      onClick={onToggleCollapse}
                    >
                      {collapsed ? <IconChevronsRight /> : <IconChevronsLeft />}
                    </Button>
                  }
                />
                <TooltipContent>{collapsed ? `Expand ${title}` : `Collapse ${title}`}</TooltipContent>
              </Tooltip>
            ) : null}
          </span>
        ) : null}
      </header>

      {collapsed ? (
        <p data-slot="kanban-column-summary" className="px-1 pb-1 text-xs text-muted-foreground">
          {collapsedSummary ?? `${count} ${count === 1 ? 'card' : 'cards'} hidden`}
        </p>
      ) : (
        <>
          {count === 0 && empty ? (
            <div data-slot="kanban-column-empty" className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-default px-3 py-4 text-center text-xs text-muted-foreground">
              {empty}
            </div>
          ) : (
            <div className="flex flex-col gap-2">{children}</div>
          )}
          {onAdd ? (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onAdd}>
              <IconPlus aria-hidden="true" /> {addLabel}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
