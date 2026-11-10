import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { OverflowList } from '@cognite/aura/components/overflow-list';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconDots } from '@cognite/aura/icons';
import { createContext, useContext, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';

export type OverflowAction = {
  id: string;
  label: string;
  /** Shown before the label in the row and in the menu. */
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Marks an irreversible action; it is styled as destructive inside the menu. */
  destructive?: boolean;
};

type OverflowActionsProps = {
  /** In priority order: the last action is the first to move into the menu. */
  actions: readonly OverflowAction[];
  /** Accessible name for the group, for example "Work order actions". */
  label: string;
  /** Accessible name and tooltip of the menu button. */
  moreLabel?: string;
  size?: 'default' | 'sm';
};

type HiddenActionsContextValue = { actions: readonly OverflowAction[]; moreLabel: string };

const HiddenActionsContext = createContext<HiddenActionsContextValue>({ actions: [], moreLabel: 'More actions' });

const ICON_SIZE = { default: 'icon', sm: 'icon-sm' } as const;

const SizeContext = createContext<'default' | 'sm'>('sm');

/** OverflowList hands over the elements it hid. They are always the last ones, so the count is enough. */
function HiddenActionsMenu({ items }: { items: ReactElement[] }) {
  const { actions, moreLabel } = useContext(HiddenActionsContext);
  const size = useContext(SizeContext);
  const hidden = actions.slice(Math.max(0, actions.length - items.length));

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size={ICON_SIZE[size]} aria-label={moreLabel}>
                  <IconDots />
                </Button>
              }
            />
          }
        />
        <TooltipContent>{moreLabel}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {hidden.map((action) => (
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

/**
 * A row of actions that never wraps or clips: when the container gets too narrow, actions move
 * from the end of the row into a "More actions" menu, one at a time, and come back when there is
 * room again. Put the row in a container that can shrink (`min-w-0` in a flex row).
 */
export function OverflowActions({ actions, label, moreLabel = 'More actions', size = 'sm' }: OverflowActionsProps) {
  const hiddenActions = useMemo(() => ({ actions, moreLabel }), [actions, moreLabel]);

  return (
    <HiddenActionsContext.Provider value={hiddenActions}>
      <SizeContext.Provider value={size}>
        <div role="group" aria-label={label} className="min-w-0">
          <OverflowList
            collapseOrder="desc"
            overflowPosition="end"
            overflowComponent={HiddenActionsMenu}
            className="gap-1"
          >
            {actions.map((action) => (
              <Button key={action.id} variant="ghost" size={size} disabled={action.disabled} onClick={action.onSelect}>
                {action.icon}
                {action.label}
              </Button>
            ))}
          </OverflowList>
        </div>
      </SizeContext.Provider>
    </HiddenActionsContext.Provider>
  );
}
