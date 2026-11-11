import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconDots } from '@cognite/aura/icons';
import type { MouseEvent as ReactMouseEvent } from 'react';

export type ContextMenuMoreButtonProps = {
  /** Accessible name and tooltip. Name the target: "More actions for 23-KA-9101". */
  label?: string;
  /** `ghost` for dense rows, `outline` for cards. */
  variant?: 'ghost' | 'outline';
};

/**
 * A visible "more" button that opens the surrounding context menu, so the same actions are
 * discoverable without knowing about right-click. Render it inside a `ContextMenuTrigger`; the menu
 * opens just below the button.
 */
export function ContextMenuMoreButton({ label = 'More actions', variant = 'ghost' }: ContextMenuMoreButtonProps) {
  const open = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.dispatchEvent(
      new window.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: Math.round(box.left),
        clientY: Math.round(box.bottom + 4),
      })
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button data-slot="context-menu-more-button" variant={variant} size="icon-sm" aria-label={label} onClick={open}>
            <IconDots />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
