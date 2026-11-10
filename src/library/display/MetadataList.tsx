import { Separator } from '@cognite/aura/components/separator';
import { Fragment } from 'react';
import type { ReactNode } from 'react';

export type MetadataEntry = { label: string; value?: ReactNode };

type MetadataListProps = {
  items: readonly MetadataEntry[];
  /**
   * `rows`: label left, value right, one pair per line, for side panels and cards.
   * `inline`: pairs on one line divided by vertical separators, for page headers.
   */
  layout?: 'rows' | 'inline';
  /** Shown instead of a missing value, so an empty field never looks like a rendering bug. */
  emptyValue?: string;
};

function isMissing(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false;
}

/**
 * Label and value pairs for a record's properties. Missing values render a placeholder, and the
 * inline layout places the separators so callers never end up with a leading or trailing one.
 */
export function MetadataList({ items, layout = 'rows', emptyValue = '—' }: MetadataListProps) {
  if (layout === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" /> : null}
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-base-foreground">
                {isMissing(item.value) ? emptyValue : item.value}
              </span>
            </span>
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <dl className="flex w-full flex-col gap-2 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-base-foreground">
            {isMissing(item.value) ? emptyValue : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
