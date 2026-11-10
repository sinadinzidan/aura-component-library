import { Badge } from '@cognite/aura/components/badge';
import { IconMinus, IconPencil, IconPlus } from '@cognite/aura/icons';

import { countChanges, diffKeyValues } from './diffKeyValues';
import type { KeyValueChange } from './diffKeyValues';

type KeyValueDiffProps = {
  /** Accessible name of the table: "Changes to 23-PT-92531 metadata". */
  label: string;
  before: Readonly<Record<string, string>>;
  after: Readonly<Record<string, string>>;
  beforeLabel?: string;
  afterLabel?: string;
  /** Hides keys whose value did not change, for long records. */
  changesOnly?: boolean;
  /** Shown where a key has no value on one side. */
  emptyValue?: string;
};

const CHANGE = {
  added: { label: 'Added', Icon: IconPlus },
  removed: { label: 'Removed', Icon: IconMinus },
  changed: { label: 'Changed', Icon: IconPencil },
} as const;

function isMarked(change: KeyValueChange): change is keyof typeof CHANGE {
  return change !== 'unchanged';
}

/**
 * Two versions of a record side by side, one row per key, with the kind of change written out.
 * The old value is struck through and the new one is emphasised, so the diff reads without
 * colour; a summary line says how much changed before anyone reads the rows.
 */
export function KeyValueDiff({
  label,
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  changesOnly = false,
  emptyValue = '—',
}: KeyValueDiffProps) {
  const all = diffKeyValues(before, after);
  const counts = countChanges(all);
  const rows = changesOnly ? all.filter((row) => row.change !== 'unchanged') : all;
  const total = counts.added + counts.removed + counts.changed;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2" data-slot="key-value-diff">
      <p className="text-xs tabular-nums text-muted-foreground">
        {total === 0
          ? 'No changes'
          : `${counts.changed} changed · ${counts.added} added · ${counts.removed} removed${
              changesOnly && counts.unchanged > 0 ? ` · ${counts.unchanged} unchanged hidden` : ''
            }`}
      </p>
      {rows.length > 0 ? (
        <table aria-label={label} className="w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-default text-xs text-muted-foreground">
              <th scope="col" className="w-1/4 py-2 pr-3 font-medium">
                Key
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                {beforeLabel}
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                {afterLabel}
              </th>
              <th scope="col" className="w-28 py-2 font-medium">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} data-change={row.change} className="border-b border-default align-top last:border-b-0">
                <th scope="row" className="break-words py-2 pr-3 font-mono text-xs font-normal leading-5 text-muted-foreground">
                  {row.key}
                </th>
                <td
                  className={`break-words py-2 pr-3 ${
                    row.change === 'changed' || row.change === 'removed' ? 'text-muted-foreground line-through' : 'text-base-foreground'
                  }`}
                >
                  {row.before ?? <span className="text-muted-foreground">{emptyValue}</span>}
                </td>
                <td
                  className={`break-words py-2 pr-3 text-base-foreground ${
                    row.change === 'changed' || row.change === 'added' ? 'font-medium' : ''
                  }`}
                >
                  {row.after ?? <span className="text-muted-foreground">{emptyValue}</span>}
                </td>
                <td className="py-2">
                  {isMarked(row.change) ? <KeyValueDiffBadge change={row.change} /> : <span className="sr-only">Unchanged</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

function KeyValueDiffBadge({ change }: { change: keyof typeof CHANGE }) {
  const { label, Icon } = CHANGE[change];
  return (
    <Badge variant="secondary">
      <Icon aria-hidden="true" /> {label}
    </Badge>
  );
}
