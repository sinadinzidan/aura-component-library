import { Button } from '@cognite/aura/components/button';
import { IconPlus, IconTrash } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { ToggleGroup } from '../../actions/ToggleGroup';
import { IconAction } from '../../patterns/collections/IconAction';

import { ConditionRow } from './ConditionRow';
import { ROOT_ID, canAddGroup, describeCondition, groupDepth } from './queryModel';
import type { Group, QueryAction, QueryField } from './queryModel';

type GroupBlockProps = {
  group: Group;
  /** The whole query, to work out depth. */
  root: Group;
  fields: readonly QueryField[];
  /** Reasons by node id from `validateQuery`. */
  issues: Readonly<Record<string, string>>;
  dispatch: (action: QueryAction) => void;
  /** Allows groups inside groups. Turn off for a flat filter. */
  allowGroups?: boolean;
  readOnly?: boolean;
  /** Counts conditions in reading order for accessible names. */
  counter?: { next: number };
};

const COMBINATORS = [
  { value: 'and', label: 'And' },
  { value: 'or', label: 'Or' },
];

/**
 * A group of conditions joined by And or Or, with its own Add condition and Add group buttons,
 * and a Not toggle that negates the whole group. Groups nest; at the depth limit the button is
 * disabled and the reason is written beside it.
 */
export function GroupBlock({ group, root, fields, issues, dispatch, allowGroups = true, readOnly = false, counter = { next: 1 } }: GroupBlockProps) {
  const isRoot = group.id === ROOT_ID;
  const depth = groupDepth(root, group.id) ?? 1;
  const groupCheck = canAddGroup(root, group.id);
  const problem = issues[group.id];

  return (
    <div
      role="group"
      aria-label={isRoot ? 'Query' : `Group, ${group.combinator === 'and' ? 'all of' : 'any of'}${group.negated ? ', negated' : ''}`}
      data-slot="group-block"
      data-negated={group.negated ? 'true' : undefined}
      data-depth={depth}
      className={cn('flex w-full min-w-0 flex-col gap-3', isRoot ? undefined : 'rounded-xl bg-muted-background p-3', group.negated ? 'border-l-2 border-warning-foreground-strong' : undefined)}
    >
      <div className="flex flex-wrap items-center gap-2">
        {readOnly ? (
          <span className="text-xs font-medium text-medium-foreground">
            {group.negated ? 'Not ' : ''}
            {group.combinator === 'and' ? 'All of' : 'Any of'}
          </span>
        ) : (
          <>
            <ToggleGroup
              label={isRoot ? 'Match' : 'Match in this group'}
              options={COMBINATORS}
              value={[group.combinator]}
              selection="single"
              required
              variant="outline"
              size="sm"
              onValueChange={(value) => {
                const next = value[0];
                if (next === 'and' || next === 'or') dispatch({ type: 'setCombinator', groupId: group.id, combinator: next });
              }}
            />
            <ToggleGroup label="Negate group" options={[{ value: 'not', label: 'Not' }]} value={group.negated ? ['not'] : []} selection="multiple" variant="outline" size="sm" onValueChange={() => dispatch({ type: 'toggleNegate', groupId: group.id })} />
            <span className="text-xs text-muted-foreground">{group.negated ? 'Matches records that fail the group.' : group.combinator === 'and' ? 'All conditions must hold.' : 'Any condition may hold.'}</span>
            {!isRoot ? (
              <span className="ml-auto">
                <IconAction label="Remove group" onClick={() => dispatch({ type: 'remove', id: group.id })}>
                  <IconTrash />
                </IconAction>
              </span>
            ) : null}
          </>
        )}
      </div>
      {group.children.length === 0 ? (
        <p data-slot="group-empty" className={cn('text-sm', problem ? 'font-medium text-critical-foreground-strong' : 'text-muted-foreground')} role={problem ? 'alert' : undefined}>
          {problem ?? 'No conditions yet. Every record matches.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-3 pl-0">
          {group.children.map((child, index) => {
            if (child.type === 'group') {
              return (
                <li key={child.id} className="min-w-0">
                  <GroupBlock group={child} root={root} fields={fields} issues={issues} dispatch={dispatch} allowGroups={allowGroups} readOnly={readOnly} counter={counter} />
                </li>
              );
            }
            const position = counter.next;
            counter.next += 1;
            return (
              <ConditionRow
                key={child.id}
                condition={child}
                fields={fields}
                position={position}
                problem={issues[child.id]}
                readOnly={readOnly}
                summary={describeCondition(child, fields)}
                canMoveUp={index > 0}
                canMoveDown={index < group.children.length - 1}
                onMove={(delta) => dispatch({ type: 'move', id: child.id, delta })}
                onRemove={() => dispatch({ type: 'remove', id: child.id })}
                onChangeField={(field) => dispatch({ type: 'changeField', id: child.id, field })}
                onChangeOperator={(op) => dispatch({ type: 'changeOperator', id: child.id, op })}
                onChangeValue={(patch) => dispatch({ type: 'setValue', id: child.id, patch })}
              />
            );
          })}
        </ul>
      )}
      {readOnly ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => dispatch({ type: 'addCondition', groupId: group.id })}>
            <IconPlus /> Add condition
          </Button>
          {allowGroups ? (
            <Button variant="ghost" size="sm" disabled={!groupCheck.ok} onClick={() => dispatch({ type: 'addGroup', groupId: group.id })}>
              <IconPlus /> Add group
            </Button>
          ) : null}
          {allowGroups && !groupCheck.ok ? <span className="text-xs text-muted-foreground">{groupCheck.reason}</span> : null}
        </div>
      )}
    </div>
  );
}
