import { Item, ItemActions, ItemCheckbox, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { IconChevronRight } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type EntityRowProps = {
  title: ReactNode;
  /** Second line: the identifier, owner or one fact that tells two rows apart. */
  description?: ReactNode;
  /** Icon or avatar that says what kind of thing the row is. */
  leading?: ReactNode;
  /** Always-visible content at the end of the row: a badge, value, timestamp or sparkline. */
  meta?: ReactNode;
  /** Icon buttons shown on hover and keyboard focus. Not for the only way to reach an action. */
  actions?: ReactNode;
  /** Controls that stay visible after `meta`, such as an overflow menu. */
  trailing?: ReactNode;
  /** `comfortable` for a handful of rows people read; `dense` for long lists people scan. */
  density?: 'comfortable' | 'dense';
  /** The row is the one shown in a detail pane. */
  selected?: boolean;
  disabled?: boolean;
  /** Makes the row open something. Adds a chevron so it reads as navigation. */
  onOpen?: () => void;
  /** Adds a leading checkbox for multi-select. */
  selection?: { checked: boolean; onChange: (checked: boolean) => void; label: string };
  /** Full-width content under the row, such as a progress bar or an expanded detail. */
  children?: ReactNode;
};

const DENSITY = {
  comfortable: 'min-h-11 gap-3 py-1.5',
  dense: 'min-h-6 gap-2',
} as const;

/**
 * One row of a collection, built on Aura's Item: what it is on the left, what state it is in on
 * the right, and at most one way to open it. Keeps every list in an app on the same anatomy, so
 * people, files, alarms and work orders all scan the same way. Render inside an `ItemGroup`.
 */
export function EntityRow({
  title,
  description,
  leading,
  meta,
  actions,
  trailing,
  density = 'comfortable',
  selected = false,
  disabled = false,
  onOpen,
  selection,
  children,
}: EntityRowProps) {
  const body = (
    <>
      {leading ? <ItemMedia>{leading}</ItemMedia> : null}
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
      </ItemContent>
      {meta ? <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">{meta}</span> : null}
      {onOpen ? <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
    </>
  );
  const layout = `flex min-w-0 flex-1 items-center ${DENSITY[density]}`;

  return (
    <Item selected={selected} disabled={disabled} aria-disabled={disabled || undefined} className={children ? 'flex-wrap' : undefined}>
      {selection ? (
        <ItemCheckbox
          aria-label={selection.label}
          checked={selection.checked}
          disabled={disabled}
          onCheckedChange={(checked) => selection.onChange(checked)}
        />
      ) : null}
      {onOpen ? (
        <button
          type="button"
          disabled={disabled}
          aria-current={selected ? 'true' : undefined}
          onClick={onOpen}
          className={`${layout} rounded-md text-left outline-none focus-visible:shadow-focus-ring`}
        >
          {body}
        </button>
      ) : (
        <div className={layout}>{body}</div>
      )}
      {actions ? <ItemActions>{actions}</ItemActions> : null}
      {trailing}
      {children ? <div className="w-full basis-full pb-1.5">{children}</div> : null}
    </Item>
  );
}
