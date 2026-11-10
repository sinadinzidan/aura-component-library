import { Badge } from '@cognite/aura/components/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { IconChevronRight } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type CollapsibleSectionProps = {
  title: string;
  /** Number of items in the section. Stays visible when the section is closed. */
  count?: number | string;
  /** Section actions. They sit outside the toggle, so they stay usable when it is closed. */
  actions?: ReactNode;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  /** Controlled state, for example to restore it from the URL. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Heading element around the toggle. */
  as?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
};

/**
 * A section whose header is the toggle: chevron, title and count open and close the content,
 * while actions on the right stay separate buttons. For one optional block of detail; stack
 * several independent ones with an Accordion instead.
 */
export function CollapsibleSection({
  title,
  count,
  actions,
  defaultOpen = true,
  open,
  onOpenChange,
  as: Heading = 'h3',
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible
      data-slot="collapsible-section"
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <Heading className="flex min-w-0 flex-1">
          <CollapsibleTrigger className="gap-2">
            <IconChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/collapsible-trigger:rotate-90"
            />
            <span className="min-w-0 truncate">{title}</span>
            {count === undefined ? null : <Badge variant="secondary">{count}</Badge>}
          </CollapsibleTrigger>
        </Heading>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
