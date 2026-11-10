import { Badge } from '@cognite/aura/components/badge';
import type { ReactNode } from 'react';

type SectionHeaderProps = {
  title: string;
  /** One line under the title saying what the section holds or how to use it. */
  description?: ReactNode;
  /** A short category above the title: "Maintenance", "Step 2 of 4". */
  overline?: string;
  /** Number of items in the section, shown beside the title. */
  count?: number | string;
  /** Sits right after the title, usually an `InfoTooltip`. */
  info?: ReactNode;
  /** Section actions, right-aligned: a link, a button, a view switch. */
  actions?: ReactNode;
  /** `sm` for groups inside a card or panel, `md` for sections of a page, `lg` for major regions. */
  size?: 'sm' | 'md' | 'lg';
  /** Draws a rule under the header. Prefer spacing; use the rule when the content below is dense. */
  divider?: boolean;
  /** Heading element. Pick the level from the page outline, not from the size. */
  as?: 'h2' | 'h3' | 'h4';
};

const TITLE: Record<NonNullable<SectionHeaderProps['size']>, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-xl font-semibold tracking-tight',
};

/**
 * The heading of a section inside a page, card or panel: title, optional count, hint and
 * description on the left, actions on the right. One component keeps the baseline, the gap to
 * the actions and the type sizes the same from section to section.
 */
export function SectionHeader({
  title,
  description,
  overline,
  count,
  info,
  actions,
  size = 'md',
  divider = false,
  as: Heading = 'h2',
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={`flex w-full min-w-0 items-end justify-between gap-4 ${divider ? 'border-b border-default pb-3' : ''}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {overline ? <p className="text-xs font-medium text-muted-foreground">{overline}</p> : null}
        <div className="flex min-w-0 items-center gap-2">
          <Heading className={`min-w-0 truncate text-base-foreground ${TITLE[size]}`}>{title}</Heading>
          {count === undefined ? null : <Badge variant="secondary">{count}</Badge>}
          {info}
        </div>
        {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
