import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconPlus, IconTrash } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type RepeatingRowsProps<Row extends { id: string }> = {
  /** Names the whole list for assistive tech, for example "Alarm limits". */
  label: string;
  rows: readonly Row[];
  /** Renders the fields of one row. Give every control a label or `aria-label`. */
  renderRow: (row: Row, index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (id: string) => void;
  /** Verb + object: "Add limit". */
  addLabel: string;
  /** Accessible name of a row's remove button: "Remove limit 2". */
  removeLabel: (row: Row, index: number) => string;
  /** Rows that must stay. The remove buttons are disabled at this count. */
  minRows?: number;
  /** Largest number of rows. The add button is disabled at this count and says why. */
  maxRows?: number;
  /** Shown next to the add button once `maxRows` is reached. */
  maxReason?: string;
};

/**
 * A list of identical field rows the user can grow and shrink: one remove button per row and an
 * add button under the list. It enforces a minimum and a maximum and always says why adding stopped.
 */
export function RepeatingRows<Row extends { id: string }>({
  label,
  rows,
  renderRow,
  onAdd,
  onRemove,
  addLabel,
  removeLabel,
  minRows = 0,
  maxRows,
  maxReason,
}: RepeatingRowsProps<Row>) {
  const atMinimum = rows.length <= minRows;
  const atMaximum = maxRows !== undefined && rows.length >= maxRows;
  const reason = maxReason ?? (maxRows === undefined ? '' : `You can add up to ${maxRows}.`);

  return (
    <div role="group" aria-label={label} className="flex w-full flex-col gap-3">
      {rows.length > 0 ? (
        <ul className="flex list-none flex-col gap-3">
          {rows.map((row, index) => (
            <li key={row.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">{renderRow(row, index)}</div>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={removeLabel(row, index)}
                      disabled={atMinimum}
                      onClick={() => onRemove(row.id)}
                    >
                      <IconTrash />
                    </Button>
                  }
                />
                <TooltipContent>{removeLabel(row, index)}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" disabled={atMaximum} onClick={onAdd}>
          <IconPlus /> {addLabel}
        </Button>
        {atMaximum && reason ? <p className="text-sm text-muted-foreground">{reason}</p> : null}
      </div>
    </div>
  );
}
