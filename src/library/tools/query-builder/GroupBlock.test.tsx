import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cond, group, TEST_FIELDS } from './fixtures';
import { GroupBlock } from './GroupBlock';
import { MAX_DEPTH, ROOT_ID } from './queryModel';
import type { Group } from './queryModel';

function setup(root: Group, props: Partial<Parameters<typeof GroupBlock>[0]> = {}) {
  const dispatch = vi.fn();
  render(<GroupBlock group={root} root={root} fields={TEST_FIELDS} issues={{}} dispatch={dispatch} {...props} />);
  return dispatch;
}

describe(GroupBlock.name, () => {
  it('says every record matches while there are no conditions', () => {
    setup(group(ROOT_ID, 'and', []));

    expect(screen.getByText('No conditions yet. Every record matches.')).toBeInTheDocument();
  });

  it('adds a condition and a group', async () => {
    const dispatch = setup(group(ROOT_ID, 'and', []));

    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add group' }));

    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: 'addCondition', groupId: ROOT_ID },
      { type: 'addGroup', groupId: ROOT_ID },
    ]);
  });

  it('switches between and and or', async () => {
    const dispatch = setup(group(ROOT_ID, 'and', []));

    await userEvent.click(screen.getByRole('button', { name: 'Or' }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'setCombinator', groupId: ROOT_ID, combinator: 'or' });
  });

  it('negates the group', async () => {
    const dispatch = setup(group(ROOT_ID, 'and', []));

    await userEvent.click(screen.getByRole('button', { name: 'Not' }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'toggleNegate', groupId: ROOT_ID });
  });

  it('explains a negated group', () => {
    setup(group(ROOT_ID, 'and', [], true));

    expect(screen.getByText('Matches records that fail the group.')).toBeInTheDocument();
  });

  it('draws nested groups, numbering conditions in reading order', () => {
    setup(group(ROOT_ID, 'and', [cond('c1', 'name', 'contains'), group('g1', 'or', [cond('c2', 'score', 'gt')])]));

    const inner = screen.getByRole('group', { name: 'Group, any of' });
    expect(within(inner).getByLabelText('Condition 2 field')).toBeInTheDocument();
    expect(screen.getByLabelText('Condition 1 field')).toBeInTheDocument();
  });

  it('removes a nested group but offers no remove on the root', async () => {
    const dispatch = setup(group(ROOT_ID, 'and', [group('g1', 'or', [cond('c2', 'score', 'gt')])]));

    await userEvent.click(screen.getByRole('button', { name: 'Remove group' }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'remove', id: 'g1' });
    expect(screen.getAllByRole('button', { name: 'Remove group' })).toHaveLength(1);
  });

  it('disables Add group at the depth limit and gives the reason', () => {
    let deepest = group('g-deep', 'and', []);
    for (let level = MAX_DEPTH - 1; level >= 1; level -= 1) deepest = group(level === 1 ? ROOT_ID : `g${level}`, 'and', [deepest]);
    render(<GroupBlock group={deepest} root={deepest} fields={TEST_FIELDS} issues={{}} dispatch={vi.fn()} />);

    const inner = screen.getAllByRole('group').find((node) => node.getAttribute('data-depth') === String(MAX_DEPTH));
    expect(inner && within(inner).getByRole('button', { name: 'Add group' })).toBeDisabled();
    expect(screen.getByText(/Groups nest 3 levels deep at most/)).toBeInTheDocument();
  });

  it('flags an empty nested group', () => {
    const root = group(ROOT_ID, 'and', [group('g1', 'or', [])]);
    setup(root, { issues: { g1: 'Add a condition or remove this group.' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Add a condition or remove this group.');
  });

  it('leaves out groups for a flat filter', () => {
    setup(group(ROOT_ID, 'and', []), { allowGroups: false });

    expect(screen.queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument();
  });

  it('shows text only and no buttons when read-only', () => {
    setup(group(ROOT_ID, 'or', [cond('c1', 'name', 'contains', { a: 'pump' })]), { readOnly: true });

    expect(screen.getByText('Any of')).toBeInTheDocument();
    expect(screen.getByText('Name contains “pump”')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
