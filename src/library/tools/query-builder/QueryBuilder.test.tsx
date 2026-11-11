import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cond, group, TEST_DATASET, TEST_NOW, TEST_OTHER_DATASET } from './fixtures';
import { QueryBuilder } from './QueryBuilder';
import { ROOT_ID } from './queryModel';

const setup = (props: Partial<Parameters<typeof QueryBuilder>[0]> = {}) => render(<QueryBuilder datasets={[TEST_DATASET, TEST_OTHER_DATASET]} now={TEST_NOW} {...props} />);

describe(QueryBuilder.name, () => {
  it('starts with every record matching', () => {
    setup();

    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText('All assets')).toBeInTheDocument();
  });

  it('flags a new condition as incomplete and does not filter by it', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter text to match.');
    expect(screen.getByText('1 incomplete condition is ignored.')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('narrows the results live as the value is typed', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    await userEvent.type(screen.getByLabelText('Condition 1 value'), 'pump');

    expect(screen.getByText('Assets where Name contains “pump”.')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('builds a nested query and counts what it finds', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' }), group('g1', 'or', [cond('c2', 'score', 'gt', { a: '90' })])]) });

    expect(screen.getByText('Assets where State is Running and Health score is above 90 %.')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('negates the group', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' })]) });

    await userEvent.click(screen.getByRole('button', { name: 'Not' }));

    expect(screen.getByText('Assets where not (State is Running).')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('removes a condition', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' })]) });

    await userEvent.click(screen.getByRole('button', { name: 'Remove condition 1' }));

    expect(screen.getByText('All assets')).toBeInTheDocument();
  });

  it('adds a group and explains the empty one', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add group' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Add a condition or remove this group.');
  });

  it('clears the query', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' })]) });

    await userEvent.click(screen.getByRole('button', { name: 'Clear query' }));

    expect(screen.getByText('All assets')).toBeInTheDocument();
  });

  it('switches data set with an empty query', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' })]) });

    await userEvent.click(screen.getByRole('combobox', { name: 'Data set' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Work orders' }));

    expect(screen.getByText('All work orders')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'WO-1' })).toBeInTheDocument();
  });

  it('saves a complete query and loads it again', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'tripped' })]) });

    await userEvent.click(screen.getByRole('tab', { name: /Saved queries/ }));
    await userEvent.type(await screen.findByLabelText('Query name'), 'Tripped assets');
    await userEvent.click(screen.getByRole('button', { name: 'Save query' }));
    await userEvent.click(screen.getByRole('button', { name: 'Load Tripped assets' }));

    expect(screen.getByText('Assets where State is Tripped.')).toBeInTheDocument();
  });

  it('will not save while a condition is incomplete', async () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'score', 'gt')]) });

    await userEvent.click(screen.getByRole('tab', { name: /Saved queries/ }));

    expect(await screen.findByText('Fix the incomplete conditions before saving.')).toBeInTheDocument();
  });

  it('is a flat filter when compact', () => {
    setup({ compact: true });

    expect(screen.queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Data set' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Saved queries/ })).not.toBeInTheDocument();
  });

  it('can leave out the results', () => {
    setup({ hideResults: true });

    expect(screen.queryByRole('tab', { name: /Results/ })).not.toBeInTheDocument();
  });

  it('applies a relative date against the given now', () => {
    setup({ initialRoot: group(ROOT_ID, 'and', [cond('c1', 'due', 'in-next', { a: '1', unit: 'weeks' })]) });

    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
