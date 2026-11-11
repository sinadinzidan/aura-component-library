import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCheck, IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TAG_SIZE, TAG_STATUS, TAG_VARIANT, tagVariantFromKey } from './tagVariants';
import type { TagSize, TagStatus, TagVariant } from './tagVariants';

export type TagProps = {
  /** The tag text. Keep it to a word or two. */
  children: ReactNode;
  /** Plain-text name, needed for the remove button when `children` is not a string. */
  label?: string;
  /** `neutral` for most tags, `outline` where many repeat, `decorative-1…7` to tell categories apart. */
  variant?: TagVariant;
  /** Picks a stable decorative variant from a category key. Ignored when `variant` is set. */
  colorKey?: string;
  /** A judged state. The only way to get a status colour; the text must still say the state. */
  status?: TagStatus;
  size?: TagSize;
  /** Monospace, for asset tags and identifiers. */
  mono?: boolean;
  /** Leading icon. */
  icon?: ReactNode;
  /** Leading dot in the tag's own colour, to pair a tag with a legend or a chart series. */
  dot?: boolean;
  /** Leading avatar, for a person or a team. Use the smallest avatar size. */
  avatar?: ReactNode;
  /** A number after the text, such as how many items carry the tag. */
  count?: number;
  /** Adds a remove button named after the tag. */
  onRemove?: () => void;
  /** Overrides the remove button's name, for example "Remove filter Site: Nordkapp". */
  removeLabel?: string;
  /** Makes the tag a toggle button with `aria-pressed`. Pass `false`, not nothing, when it is off. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Makes the tag a plain button, for example to open the tagged item. */
  onClick?: () => void;
  /** Keeps the tag focusable but inert. Give `disabledReason` so people can find out why. */
  disabled?: boolean;
  /** Shown in a tooltip and read out when the tag is disabled. */
  disabledReason?: string;
  /** Tooltip text: the full text of a tag that is cut short, or a short explanation. */
  tooltip?: string;
  /** For roving focus in a `TagGroup`. */
  tabIndex?: number;
  /** Layout classes: a width cap such as `max-w-40` to truncate. */
  className?: string;
};

const FOCUS = 'outline-none focus-visible:shadow-focus-ring';

/**
 * A compact label for a category, an identifier or a choice. Static by default; it becomes a
 * toggle with `selected`, a button with `onClick`, and removable with `onRemove`. Colour comes
 * from a neutral or decorative variant; status colour only through `status`.
 */
export function Tag({
  children,
  label,
  variant,
  colorKey,
  status,
  size = 'md',
  mono = false,
  icon,
  dot = false,
  avatar,
  count,
  onRemove,
  removeLabel,
  selected,
  onSelectedChange,
  onClick,
  disabled = false,
  disabledReason,
  tooltip,
  tabIndex,
  className,
}: TagProps) {
  const selectable = selected !== undefined;
  const interactive = selectable || onClick !== undefined;
  const resolvedVariant = variant ?? (colorKey !== undefined ? tagVariantFromKey(colorKey) : 'neutral');
  const shownVariant = selectable && !selected ? 'outline' : resolvedVariant;
  const name = label ?? (typeof children === 'string' ? children : '');
  const tooltipText = disabled ? disabledReason : tooltip;
  const sizes = TAG_SIZE[size];

  const tone = disabled
    ? 'border-disabled bg-transparent text-base-foreground-disabled'
    : status !== undefined && !(selectable && !selected)
      ? TAG_STATUS[status]
      : cn(TAG_VARIANT[shownVariant].rest, interactive && status === undefined && TAG_VARIANT[shownVariant].hover);

  const mainClass = cn(
    'inline-flex min-w-0 items-center rounded-[inherit]',
    sizes.main,
    sizes.icon,
    onRemove && 'pr-0.5',
    (interactive || tooltipText !== undefined) && FOCUS,
    interactive && (disabled ? 'cursor-not-allowed' : 'cursor-pointer')
  );

  const content = (
    <>
      {selectable && selected ? <IconCheck aria-hidden="true" data-slot="tag-check" className="shrink-0" /> : null}
      {avatar ? <span className="-ml-0.5 flex shrink-0 items-center">{avatar}</span> : null}
      {dot ? <span aria-hidden="true" data-slot="tag-dot" className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {icon ? (
        <span aria-hidden="true" className={cn('flex shrink-0 items-center', sizes.icon)}>
          {icon}
        </span>
      ) : null}
      <span data-slot="tag-label" className={cn('min-w-0 truncate', mono && 'font-mono')}>
        {children}
      </span>
      {count !== undefined ? (
        <span data-slot="tag-count" className="shrink-0 font-normal tabular-nums opacity-70">
          {count}
        </span>
      ) : null}
      {disabled && disabledReason ? <span className="sr-only">. {disabledReason}</span> : null}
    </>
  );

  const main = interactive ? (
    <button
      type="button"
      data-slot="tag-main"
      aria-pressed={selectable ? selected : undefined}
      aria-disabled={disabled ? true : undefined}
      tabIndex={tabIndex}
      onClick={() => {
        if (disabled) return;
        if (selectable) onSelectedChange?.(!selected);
        onClick?.();
      }}
      className={mainClass}
    >
      {content}
    </button>
  ) : (
    <span data-slot="tag-main" tabIndex={tooltipText !== undefined ? (tabIndex ?? 0) : undefined} className={mainClass}>
      {content}
    </span>
  );

  return (
    <span
      data-slot="tag"
      data-variant={status ?? shownVariant}
      data-size={size}
      data-selected={selectable && selected ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'inline-flex max-w-full min-w-0 shrink-0 items-stretch rounded-md border align-middle leading-none font-medium whitespace-nowrap transition-colors',
        sizes.root,
        tone,
        className
      )}
    >
      {tooltipText !== undefined ? (
        <Tooltip>
          <TooltipTrigger render={main} />
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      ) : (
        main
      )}
      {onRemove ? (
        <button
          type="button"
          data-slot="tag-remove"
          aria-label={removeLabel ?? `Remove ${name}`.trim()}
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center rounded-[inherit] opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-100',
            sizes.remove,
            FOCUS
          )}
        >
          <IconX aria-hidden="true" className={size === 'sm' ? 'size-3' : 'size-3.5'} />
        </button>
      ) : null}
    </span>
  );
}
