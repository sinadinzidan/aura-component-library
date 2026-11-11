import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { Tag } from './Tag';
import { nextTagGroupValue, rovingIndex } from './tagGroup';
import type { TagGroupSelection } from './tagGroup';
import type { TagSize, TagVariant } from './tagVariants';

export type TagGroupOption = {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
  /** Why the option cannot be chosen. */
  disabledReason?: string;
};

export type TagGroupProps = {
  /** Accessible name of the group: "Filter by discipline". */
  label: string;
  options: readonly TagGroupOption[];
  /** The selected values. One at most when `selection` is `single`. */
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  selection?: TagGroupSelection;
  /** Whether the last selected tag can be turned off. */
  allowEmpty?: boolean;
  size?: TagSize;
  /** Variant of the selected tags. */
  variant?: TagVariant;
  mono?: boolean;
  /** Keeps the tags on one line instead of wrapping. */
  nowrap?: boolean;
  className?: string;
};

/**
 * A row of selectable tags for a quick filter or a choice between a few options. The group is one
 * tab stop: arrow keys, Home and End move between tags, Space or Enter toggles the focused one.
 */
export function TagGroup({
  label,
  options,
  value,
  onValueChange,
  selection = 'multiple',
  allowEmpty = true,
  size = 'lg',
  variant,
  mono = false,
  nowrap = false,
  className,
}: TagGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enabled = options.map((option) => !option.disabled);
  const firstSelected = options.findIndex((option) => value.includes(option.value) && !option.disabled);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const fallback = firstSelected >= 0 ? firstSelected : Math.max(0, enabled.indexOf(true));
  const tabStop = focusIndex !== null && focusIndex < options.length ? focusIndex : fallback;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = rovingIndex(tabStop, event.key, enabled);
    if (next === tabStop) return;
    event.preventDefault();
    setFocusIndex(next);
    containerRef.current?.querySelectorAll<HTMLElement>('[data-slot="tag-main"]')[next]?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      data-slot="tag-group"
      data-selection={selection}
      onKeyDown={onKeyDown}
      className={cn('flex min-w-0 items-center gap-1.5', !nowrap && 'flex-wrap', className)}
    >
      {options.map((option, index) => (
        <Tag
          key={option.value}
          size={size}
          variant={variant}
          mono={mono}
          icon={option.icon}
          count={option.count}
          disabled={option.disabled}
          disabledReason={option.disabledReason}
          tabIndex={index === tabStop ? 0 : -1}
          selected={value.includes(option.value)}
          onSelectedChange={() => {
            setFocusIndex(index);
            onValueChange(nextTagGroupValue(value, option.value, selection, allowEmpty));
          }}
        >
          {option.label}
        </Tag>
      ))}
    </div>
  );
}
