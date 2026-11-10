import {
  ActionToolbar,
  ActionToolbarAction,
  ActionToolbarActionClear,
  ActionToolbarActions,
  ActionToolbarPrimaryAction,
  ActionToolbarSelection,
  ActionToolbarSelectionSummary,
} from '@cognite/aura/components/action-toolbar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { IconDots } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type SelectionAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type SelectionActionBarProps = {
  /** Number of selected items. The bar leaves when this is 0. */
  count: number;
  /** Singular and plural noun for the selected things, for example "alarm" and "alarms". */
  noun: { one: string; other: string };
  /** Actions for the selection, most used first. */
  actions: readonly SelectionAction[];
  /** How many actions stay visible; the rest move into a "More actions" menu. */
  maxVisible?: number;
  /** The one action most selections end with. */
  primaryAction?: { label: string; onSelect: () => void; disabled?: boolean };
  onClear: () => void;
  clearLabel?: string;
  width?: 'full' | 'fit';
};

/**
 * An Action toolbar driven by data: it words the selection count, keeps the first few actions
 * visible and moves the rest into an overflow menu, so every bulk-action bar reads the same.
 */
export function SelectionActionBar({
  count,
  noun,
  actions,
  maxVisible = 2,
  primaryAction,
  onClear,
  clearLabel = 'Clear',
  width = 'full',
}: SelectionActionBarProps) {
  const visible = actions.slice(0, maxVisible);
  const overflow = actions.slice(maxVisible);

  return (
    <ActionToolbar selectedCount={count} width={width} aria-label={`Actions for selected ${noun.other}`}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary label={`${count === 1 ? noun.one : noun.other} selected`} />
        <ActionToolbarActionClear label={clearLabel} onClick={onClear} />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        {visible.map((action) => (
          <ActionToolbarAction
            key={action.id}
            variant={action.destructive ? 'destructive' : undefined}
            disabled={action.disabled}
            onClick={action.onSelect}
          >
            {action.icon}
            {action.label}
          </ActionToolbarAction>
        ))}
        {overflow.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <ActionToolbarAction iconOnly aria-label="More actions">
                  <IconDots />
                </ActionToolbarAction>
              }
            />
            <DropdownMenuContent align="end" side="top">
              {overflow.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  variant={action.destructive ? 'destructive' : undefined}
                  disabled={action.disabled}
                  onClick={action.onSelect}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {primaryAction ? (
          <ActionToolbarPrimaryAction disabled={primaryAction.disabled} onClick={primaryAction.onSelect}>
            {primaryAction.label}
          </ActionToolbarPrimaryAction>
        ) : null}
      </ActionToolbarActions>
    </ActionToolbar>
  );
}
