import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconInfoCircle } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type InfoTooltipProps = {
  /** Accessible name of the icon button, such as "About health score". */
  label: string;
  /** The hint: one or two short sentences, no interactive content. */
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

/**
 * A small info icon that explains the label or value next to it. It is a real button, so the hint
 * is reachable by keyboard and touch as well as hover.
 */
export function InfoTooltip({ label, children, side = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <IconInfoCircle />
          </Button>
        }
      />
      <TooltipContent side={side}>
        <span className="max-w-64 whitespace-normal">{children}</span>
      </TooltipContent>
    </Tooltip>
  );
}
