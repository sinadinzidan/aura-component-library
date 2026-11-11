import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { Tag } from './Tag';
import type { TagSize, TagVariant } from './tagVariants';

export type TagListItem = {
  id: string;
  label: string;
  /** Overrides the list's variant for this tag. */
  variant?: TagVariant;
  /** Picks a stable decorative colour for this tag. */
  colorKey?: string;
  icon?: ReactNode;
};

export type TagListProps = {
  /** Accessible name of the list: "Labels". */
  label: string;
  /** Plain strings, or items when tags differ in colour or icon. */
  tags: readonly (string | TagListItem)[];
  /** Tags beyond this number fold into a "+N" tag that lists them on hover and focus. */
  max?: number;
  size?: TagSize;
  variant?: TagVariant;
  /** Monospace, for asset tags and identifiers. */
  mono?: boolean;
  /** Keeps the list on one line. Combine with `max`. */
  nowrap?: boolean;
  /** Makes every tag removable. Called with the tag's id. */
  onRemove?: (id: string) => void;
  className?: string;
};

const toItem = (tag: string | TagListItem): TagListItem => (typeof tag === 'string' ? { id: tag, label: tag } : tag);

/**
 * Tags in a row. Past `max` the rest collapse into one "+N" tag, so a table cell or a card
 * header keeps its height however many tags a record has; the hidden ones stay reachable by
 * keyboard and are read out by name.
 */
export function TagList({ label, tags, max, size = 'md', variant, mono = false, nowrap = false, onRemove, className }: TagListProps) {
  const items = tags.map(toItem);
  const limit = max === undefined ? items.length : Math.max(0, max);
  const visible = items.slice(0, limit);
  const hidden = items.slice(limit);
  const hiddenNames = hidden.map((item) => item.label).join(', ');

  return (
    <ul
      aria-label={label}
      data-slot="tag-list"
      className={cn('flex min-w-0 list-none items-center gap-1.5', !nowrap && 'flex-wrap', className)}
    >
      {visible.map((item) => (
        <li key={item.id} className="flex min-w-0">
          <Tag
            size={size}
            variant={item.variant ?? variant}
            colorKey={item.colorKey}
            icon={item.icon}
            mono={mono}
            onRemove={onRemove ? () => onRemove(item.id) : undefined}
          >
            {item.label}
          </Tag>
        </li>
      ))}
      {hidden.length > 0 ? (
        <li className="flex shrink-0" data-slot="tag-list-overflow">
          <Tag size={size} variant="outline" tooltip={hiddenNames}>
            <span className="tabular-nums">+{hidden.length}</span>
            <span className="sr-only"> more: {hiddenNames}</span>
          </Tag>
        </li>
      ) : null}
    </ul>
  );
}
