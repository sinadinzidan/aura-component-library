import { IconX } from '@cognite/aura/icons';

type FilterChipProps = {
  /** The filtered property: "Site". */
  label: string;
  /** The applied value, already formatted: "Nordkapp" or "3 selected". */
  value: string;
  onRemove: () => void;
};

/**
 * One applied filter, shown as "Property: value" with a button that removes it. The remove
 * button names the whole filter so a list of chips makes sense without seeing it.
 */
export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <span
      data-slot="filter-chip"
      className="inline-flex h-7 max-w-full items-center gap-1 rounded-md bg-medium-background pl-2 pr-1 text-sm text-base-foreground"
    >
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="truncate font-medium">{value}</span>
      <button
        type="button"
        aria-label={`Remove filter ${label}: ${value}`}
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-medium-background-hover hover:text-base-foreground focus-visible:shadow-focus-ring"
        onClick={onRemove}
      >
        <IconX aria-hidden="true" className="size-3.5" />
      </button>
    </span>
  );
}
