import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { IconDots } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type RowAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Marks an irreversible action. Keep it last in the list. */
  destructive?: boolean;
};

type RowActionsMenuProps = {
  /** Accessible name of the trigger. Include what the row is, for example "Actions for WO-104482". */
  label: string;
  actions: readonly RowAction[];
};

/**
 * The trailing "more" menu of a table row: one quiet icon button that opens the actions for
 * that row, so a dense table does not repeat a strip of buttons on every line.
 */
export function RowActionsMenu({ label, actions }: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <IconDots />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.disabled}
            variant={action.destructive ? 'destructive' : 'default'}
            onClick={action.onSelect}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
