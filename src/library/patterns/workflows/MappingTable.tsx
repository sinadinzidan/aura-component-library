import { IconAlertTriangle, IconArrowRight, IconCheck, IconMinus, IconWand } from '@cognite/aura/icons';

import { OptionSelect } from '../data-entry/OptionSelect';

import { mappingRowStatus, missingRequiredFields } from './columnMapping';
import type { ColumnMapping, MappingRowStatus, TargetField } from './columnMapping';

export type SourceColumn = {
  /** Header as it appears in the file. */
  name: string;
  /** The first few values of the column, so the reader can check the match. */
  samples: readonly string[];
};

export type MappingTableProps = {
  /** Accessible name of the table: "Column mapping for nordkapp-tags.csv". */
  label: string;
  columns: readonly SourceColumn[];
  fields: readonly TargetField[];
  /** Current mapping: column name → field id, or `null` when the column is not imported. */
  mapping: ColumnMapping;
  /** What the automatic match proposed, to tell "auto-mapped" from "mapped by you". */
  suggested: ColumnMapping;
  onChange: (column: string, fieldId: string | null) => void;
  /** Label of the option that leaves a column out. */
  skipLabel?: string;
};

const SKIP = '__skip__';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-middle';

const STATUS: Record<MappingRowStatus | 'attention', { label: string; Icon: typeof IconCheck; text: string }> = {
  auto: { label: 'Auto-mapped', Icon: IconWand, text: 'text-muted-foreground' },
  manual: { label: 'Mapped by you', Icon: IconCheck, text: 'text-muted-foreground' },
  skipped: { label: 'Not imported', Icon: IconMinus, text: 'text-muted-foreground' },
  attention: { label: 'Needs attention', Icon: IconAlertTriangle, text: 'font-medium text-warning-foreground-strong' },
  duplicate: { label: 'Field used twice', Icon: IconAlertTriangle, text: 'font-medium text-critical-foreground-strong' },
};

/**
 * The mapping step of an import: one row per column of the file, with sample values, the target
 * field it feeds and how that match came about. Columns left unmapped while a required field is
 * still missing are flagged, and the missing fields are listed under the table. Sits on the base
 * surface so the selects stay visible in dark themes.
 */
export function MappingTable({ label, columns, fields, mapping, suggested, onChange, skipLabel = 'Do not import' }: MappingTableProps) {
  const missing = missingRequiredFields(mapping, fields);
  const options = [
    ...fields.map((field) => ({ value: field.id, label: field.required ? `${field.label} (required)` : field.label })),
    { value: SKIP, label: skipLabel },
  ];

  return (
    <div data-slot="mapping-table" className="flex w-full min-w-0 flex-col gap-3">
      <table aria-label={label} className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-default">
            <th scope="col" className={TH}>
              Column in file
            </th>
            <th scope="col" className={TH}>
              Sample values
            </th>
            <th scope="col" className={`${TH} w-8`}>
              <span className="sr-only">Maps to</span>
            </th>
            <th scope="col" className={TH}>
              Target field
            </th>
            <th scope="col" className={TH}>
              Match
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => {
            const raw = mappingRowStatus(column.name, mapping, suggested);
            const status = raw === 'skipped' && missing.length > 0 ? 'attention' : raw;
            const { label: statusLabel, Icon, text } = STATUS[status];
            return (
              <tr key={column.name} data-status={status} className="border-b border-default">
                <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
                  {column.name}
                </th>
                <td className={`${TD} max-w-48 text-xs text-muted-foreground`}>
                  <span className="block truncate font-mono">{column.samples.join(', ')}</span>
                </td>
                <td className={TD}>
                  <IconArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
                </td>
                <td className={TD}>
                  <OptionSelect
                    aria-label={`Target field for ${column.name}`}
                    size="sm"
                    options={options}
                    value={mapping[column.name] ?? SKIP}
                    onValueChange={(value) => onChange(column.name, value === SKIP ? null : value)}
                  />
                </td>
                <td className={TD}>
                  <span className={`flex items-center gap-1.5 whitespace-nowrap text-xs ${text}`}>
                    <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                    {statusLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div aria-live="polite">
        {missing.length > 0 ? (
          <p data-slot="mapping-missing" className="flex items-start gap-1.5 text-sm text-critical-foreground-strong">
            <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {missing.length === 1 ? 'A required field has no column' : `${missing.length} required fields have no column`}:{' '}
              <span className="font-medium">{missing.map((field) => field.label).join(', ')}</span>. Map a column to continue.
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
