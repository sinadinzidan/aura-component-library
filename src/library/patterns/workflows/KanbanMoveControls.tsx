import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSectionLabel,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowLeft, IconArrowRight, IconCheck, IconDots } from '@cognite/aura/icons';

export type KanbanMoveTarget = { id: string; title: string };

export type KanbanMoveControlsProps = {
  /** What is being moved, for the accessible names: "WO-104482". */
  cardLabel: string;
  /** Every column of the board, in order. */
  columns: readonly KanbanMoveTarget[];
  /** The column the card is in. */
  currentColumnId: string;
  onMove: (columnId: string) => void;
  /** `buttons`: previous and next arrows. `menu`: a "Move to…" menu. `both`: arrows and menu. */
  controls?: 'buttons' | 'menu' | 'both';
};

/**
 * Moves a card between columns without dragging: arrow buttons step to the neighbouring column
 * and a menu jumps to any column. Both work from the keyboard, which makes them the accessible
 * equivalent a drag-and-drop board still needs.
 */
export function KanbanMoveControls({ cardLabel, columns, currentColumnId, onMove, controls = 'both' }: KanbanMoveControlsProps) {
  const index = columns.findIndex((column) => column.id === currentColumnId);
  const previous = index > 0 ? columns[index - 1] : undefined;
  const next = index >= 0 ? columns[index + 1] : undefined;
  const previousLabel = previous ? `Move ${cardLabel} to ${previous.title}` : `${cardLabel} is in the first column`;
  const nextLabel = next ? `Move ${cardLabel} to ${next.title}` : `${cardLabel} is in the last column`;

  return (
    <span data-slot="kanban-move-controls" className="flex items-center">
      {controls !== 'menu' ? (
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={previousLabel} disabled={!previous} onClick={() => previous && onMove(previous.id)}>
                  <IconArrowLeft />
                </Button>
              }
            />
            <TooltipContent>{previousLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={nextLabel} disabled={!next} onClick={() => next && onMove(next.id)}>
                  <IconArrowRight />
                </Button>
              }
            />
            <TooltipContent>{nextLabel}</TooltipContent>
          </Tooltip>
        </>
      ) : null}
      {controls !== 'buttons' ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Move ${cardLabel} to…`}>
                <IconDots />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuSectionLabel>Move to…</DropdownMenuSectionLabel>
            {columns.map((column) => (
              <DropdownMenuItem key={column.id} disabled={column.id === currentColumnId} onClick={() => onMove(column.id)}>
                {column.title}
                {column.id === currentColumnId ? (
                  <>
                    <span className="sr-only">, current column</span>
                    <IconCheck aria-hidden="true" className="ml-auto" />
                  </>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </span>
  );
}
