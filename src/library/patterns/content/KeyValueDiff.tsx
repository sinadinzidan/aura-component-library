import { Badge } from '@cognite/aura/components/badge';
import { IconMinus, IconPencil, IconPlus } from '@cognite/aura/icons';

import { Table } from '../../primitives/table/Table';
import type { TableProps } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCell } from '../../primitives/table/TableCell';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableRow } from '../../primitives/table/TableRow';

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
  /** The surface the diff sits on, so its rows match it. */
  surface?: TableProps['surface'];
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
  surface = 'base',
}: KeyValueDiffProps) {
  const all = diffKeyValues(before, after);
  const counts = countChanges(all);
  const rows = changesOnly
    ? all.filter((row) => row.change !== 'unchanged')
    : all;
  const total = counts.added + counts.removed + counts.changed;

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-2"
      data-slot="key-value-diff"
    >
      <p className="text-xs tabular-nums text-muted-foreground">
        {total === 0
          ? 'No changes'
          : `${counts.changed} changed · ${counts.added} added · ${counts.removed} removed${
              changesOnly && counts.unchanged > 0
                ? ` · ${counts.unchanged} unchanged hidden`
                : ''
            }`}
      </p>
      {rows.length > 0 ? (
        <Table label={label} layout="fixed" hover={false} surface={surface}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Key</TableHead>
              <TableHead>{beforeLabel}</TableHead>
              <TableHead>{afterLabel}</TableHead>
              <TableHead className="w-28">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell rowHeader mono wrap="wrap" className="align-top">
                  <span className="leading-5 font-normal text-muted-foreground">
                    {row.key}
                  </span>
                </TableCell>
                <TableCell className="align-top">
                  {row.before === undefined ? (
                    <span className="text-muted-foreground">{emptyValue}</span>
                  ) : (
                    <span
                      className={
                        row.change === 'changed' || row.change === 'removed'
                          ? 'text-muted-foreground line-through'
                          : 'text-base-foreground'
                      }
                    >
                      {row.before}
                    </span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {row.after === undefined ? (
                    <span className="text-muted-foreground">{emptyValue}</span>
                  ) : (
                    <span
                      className={
                        row.change === 'changed' || row.change === 'added'
                          ? 'font-medium text-base-foreground'
                          : 'text-base-foreground'
                      }
                    >
                      {row.after}
                    </span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {isMarked(row.change) ? (
                    <KeyValueDiffBadge change={row.change} />
                  ) : (
                    <span className="sr-only">Unchanged</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
