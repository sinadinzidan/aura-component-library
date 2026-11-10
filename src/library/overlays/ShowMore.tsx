import { Button } from '@cognite/aura/components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { IconChevronDown } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

type ShowMoreProps = {
  /** The part that is always visible. */
  summary: ReactNode;
  /** The rest, revealed below the summary. */
  children: ReactNode;
  moreLabel?: string;
  lessLabel?: string;
  defaultOpen?: boolean;
  /** Called after the user expands or collapses the text. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Long text that starts as a summary with a "Show more" button under it. The button label follows
 * the state, and the hidden part stays in the page so search and assistive tech can reach it.
 */
export function ShowMore({
  summary,
  children,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  defaultOpen = false,
  onOpenChange,
}: ShowMoreProps) {
  const [open, setOpen] = useState(defaultOpen);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Collapsible open={open} onOpenChange={changeOpen}>
      <div className="text-sm text-base-foreground">{summary}</div>
      <CollapsibleContent>
        <div className="pt-2 text-sm text-base-foreground">{children}</div>
      </CollapsibleContent>
      <div className="w-fit pt-2">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm">
              {open ? lessLabel : moreLabel}
              <IconChevronDown
                aria-hidden="true"
                className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
            </Button>
          }
        />
      </div>
    </Collapsible>
  );
}
