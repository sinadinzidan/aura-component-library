import { Badge } from '@cognite/aura/components/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ComponentProps } from 'react';

type TagListProps = {
  /** Accessible name of the list: "Labels". */
  label: string;
  tags: readonly string[];
  /** Tags beyond this number fold into a "+N" chip that lists them on hover and focus. */
  max?: number;
  /** Monospace, for asset tags and identifiers. */
  mono?: boolean;
  /** Badge variant shared by every tag. Categories are neutral or decorative, never a status. */
  variant?: ComponentProps<typeof Badge>['variant'];
  outline?: boolean;
  /** Keeps the list on one line. Combine with `max`. */
  nowrap?: boolean;
};

/**
 * Read-only tags in a row. Past `max` the rest collapse into one "+N" chip, so a cell or a card
 * header keeps its height however many tags a record has; the hidden ones stay reachable by
 * keyboard and are read out by name.
 */
export function TagList({ label, tags, max, mono = false, variant = 'secondary', outline = false, nowrap = false }: TagListProps) {
  const limit = max === undefined ? tags.length : Math.max(0, max);
  const visible = tags.slice(0, limit);
  const hidden = tags.slice(limit);

  return (
    <ul aria-label={label} data-slot="tag-list" className={`flex min-w-0 list-none items-center gap-1.5 ${nowrap ? '' : 'flex-wrap'}`}>
      {visible.map((tag) => (
        <li key={tag} className="flex min-w-0">
          <Badge variant={variant} outline={outline}>
            <span className={mono ? 'font-mono' : undefined}>{tag}</span>
          </Badge>
        </li>
      ))}
      {hidden.length > 0 ? (
        <li className="flex shrink-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge variant="secondary" outline tabIndex={0} aria-label={`${hidden.length} more: ${hidden.join(', ')}`}>
                  <span className="tabular-nums">+{hidden.length}</span>
                </Badge>
              }
            />
            <TooltipContent>
              <span className="max-w-64 whitespace-normal">{hidden.join(', ')}</span>
            </TooltipContent>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}
