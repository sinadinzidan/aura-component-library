import { IconAlertTriangle, IconArrowDown, IconArrowUp, IconTrash } from '@cognite/aura/icons';
import { useId } from 'react';

import { IconAction } from '../../patterns/collections/IconAction';
import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import { operatorLabel, operatorsFor } from './queryModel';
import type { Condition, Operator, QueryField, QueryValue } from './queryModel';
import { ValueEditor } from './ValueEditor';

type ConditionRowProps = {
  condition: Condition;
  fields: readonly QueryField[];
  /** 1-based position, used in accessible names: "Condition 2". */
  position: number;
  /** Why the condition is incomplete. Shown under the row. */
  problem?: string;
  onChangeField: (field: string) => void;
  onChangeOperator: (op: Operator) => void;
  onChangeValue: (patch: Partial<QueryValue>) => void;
  onRemove?: () => void;
  onMove?: (delta: number) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Shows the condition as text, with no controls. */
  readOnly?: boolean;
  /** Text for read-only mode, from `describeCondition`. */
  summary?: string;
};

/**
 * One condition: a field, an operator that depends on the field's type, and a value editor that
 * depends on the operator. An incomplete condition says what is missing instead of being
 * silently ignored.
 */
export function ConditionRow({
  condition,
  fields,
  position,
  problem,
  onChangeField,
  onChangeOperator,
  onChangeValue,
  onRemove,
  onMove,
  canMoveUp = true,
  canMoveDown = true,
  readOnly = false,
  summary,
}: ConditionRowProps) {
  const messageId = useId();
  const field = fields.find((entry) => entry.key === condition.field);
  const label = `Condition ${position}`;

  if (readOnly) {
    return (
      <li data-slot="condition-row" className="py-1 text-sm text-base-foreground">
        {summary || 'Incomplete condition'}
      </li>
    );
  }

  return (
    <li data-slot="condition-row" data-invalid={problem ? 'true' : undefined} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-44 shrink-0">
          <OptionSelect size="sm" aria-label={`${label} field`} options={fields.map((entry) => ({ value: entry.key, label: entry.label }))} value={field ? condition.field : undefined} placeholder="Choose a field" onValueChange={onChangeField} />
        </div>
        <div className="w-40 shrink-0">
          <OptionSelect
            size="sm"
            aria-label={`${label} operator`}
            options={(field ? operatorsFor(field.kind) : []).map((op) => ({ value: op, label: operatorLabel(op) }))}
            value={field ? condition.op : undefined}
            placeholder="Choose an operator"
            onValueChange={(op) => {
              const match = field ? operatorsFor(field.kind).find((candidate) => candidate === op) : undefined;
              if (match) onChangeOperator(match);
            }}
          />
        </div>
        {field ? <ValueEditor condition={condition} field={field} label={label} onChange={onChangeValue} invalid={problem !== undefined} describedBy={problem ? messageId : undefined} /> : null}
        <div className="ml-auto flex items-center">
          {onMove ? (
            <>
              <IconAction label={canMoveUp ? `Move ${label.toLowerCase()} up` : `${label} is first`} disabled={!canMoveUp} onClick={() => onMove(-1)}>
                <IconArrowUp />
              </IconAction>
              <IconAction label={canMoveDown ? `Move ${label.toLowerCase()} down` : `${label} is last`} disabled={!canMoveDown} onClick={() => onMove(1)}>
                <IconArrowDown />
              </IconAction>
            </>
          ) : null}
          {onRemove ? (
            <IconAction label={`Remove ${label.toLowerCase()}`} onClick={onRemove}>
              <IconTrash />
            </IconAction>
          ) : null}
        </div>
      </div>
      {problem ? (
        <p id={messageId} role="alert" className="flex items-center gap-1 text-xs font-medium text-critical-foreground-strong">
          <IconAlertTriangle aria-hidden className="size-3.5" /> {problem}
        </p>
      ) : null}
    </li>
  );
}
