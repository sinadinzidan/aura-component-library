import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowUp, IconChevronRight } from '@cognite/aura/icons';

import { cn } from '../../lib/utils';

export type DrillCrumb = {
  id: string;
  label: string;
  /** Small text before the label naming the level: "Plant", "Area". */
  kind?: string;
};

export type DrillBreadcrumbProps = {
  /** From the top level down to where the user is now. The last crumb is the current one. */
  crumbs: readonly DrillCrumb[];
  /** Called with the id of an ancestor crumb. */
  onNavigate: (id: string) => void;
  /** One level up. The button hides at the top level. */
  onUp?: () => void;
  /** Accessible name of the trail. */
  label?: string;
  className?: string;
};

/**
 * Where you are in a drill-down, on a glass strip for use over a scene: an "up" button, then
 * every level from the top. Ancestors are buttons; the current level is plain text.
 */
export function DrillBreadcrumb({ crumbs, onNavigate, onUp, label = 'Drill-down path', className }: DrillBreadcrumbProps) {
  const canGoUp = Boolean(onUp) && crumbs.length > 1;

  return (
    <nav
      aria-label={label}
      data-slot="drill-breadcrumb"
      className={cn(
        'flex min-w-0 items-center gap-1 rounded-lg border border-default px-1.5 py-1 backdrop-blur-md',
        'bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)]',
        className
      )}
    >
      {canGoUp ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Go up one level" onClick={onUp}>
                <IconArrowUp />
              </Button>
            }
          />
          <TooltipContent side="bottom">Up one level (Esc)</TooltipContent>
        </Tooltip>
      ) : null}
      <ol className="flex min-w-0 items-center gap-0.5">
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          const text = (
            <>
              {crumb.kind ? <span className="text-muted-foreground">{crumb.kind}</span> : null}
              <span className={cn('truncate', isCurrent ? 'font-medium text-base-foreground' : 'text-medium-foreground')}>{crumb.label}</span>
            </>
          );
          return (
            <li key={crumb.id} className="flex min-w-0 items-center gap-0.5 text-sm">
              {index > 0 ? <IconChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
              {isCurrent ? (
                <span aria-current="location" className="flex min-w-0 items-center gap-1.5 px-1.5 py-1">
                  {text}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate(crumb.id)}
                  className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-secondary-background focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]"
                >
                  {text}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
