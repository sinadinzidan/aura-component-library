import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';

import { fixtureTree } from './drilldownFixture';
import { MillerColumns } from './MillerColumns';
import { createMillerReducer, createMillerState } from './millerReducer';

const roots = [fixtureTree().root];
const reducer = createMillerReducer(roots);

function Harness({ start = ['site'] }: { start?: readonly string[] }) {
  const [state, dispatch] = useReducer(reducer, createMillerState(roots, start));
  return (
    <>
      <MillerColumns roots={roots} state={state} dispatch={dispatch} titles={{ sensor: 'Tag' }} />
      <output>{state.path.join('/')}</output>
    </>
  );
}

const list = (name: string) => screen.getByRole('listbox', { name });
const path = () => screen.getByRole('status').textContent;

describe(MillerColumns.name, () => {
  it('shows four columns and fills the one right of a selection', () => {
    render(<Harness />);

    expect(screen.getAllByRole('region')).toHaveLength(4);
    expect(within(list('Area')).getAllByRole('option')).toHaveLength(2);
    expect(screen.getByText('Pick an area on the left')).toBeInTheDocument();
    expect(screen.getByText('Pick equipment on the left')).toBeInTheDocument();
  });

  it('fills the next column when a row is clicked', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('option', { name: /Gas compression/ }));

    expect(within(list('Equipment')).getAllByRole('option')).toHaveLength(2);
    expect(path()).toBe('site/area-b');
  });

  it('moves down and up within a column with the arrow keys', () => {
    render(<Harness start={['site', 'area-a']} />);

    fireEvent.keyDown(list('Area'), { key: 'ArrowDown' });
    expect(path()).toBe('site/area-b');

    fireEvent.keyDown(list('Area'), { key: 'ArrowUp' });
    expect(path()).toBe('site/area-a');
  });

  it('moves right into the next column and left back out, taking focus along', async () => {
    render(<Harness start={['site', 'area-b']} />);
    list('Area').focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(path()).toBe('site/area-b/comp-1');
    expect(list('Equipment')).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(path()).toBe('site/area-b');
    expect(list('Area')).toHaveFocus();
  });

  it('reaches a tag with the keyboard alone', async () => {
    render(<Harness />);
    list('Site').focus();

    await userEvent.keyboard('{ArrowRight}{ArrowDown}{ArrowRight}{ArrowRight}{ArrowDown}');

    expect(path()).toBe('site/area-b/comp-1/tt');
    expect(list('Tag')).toHaveFocus();
  });

  it('filters the active column by typing and clears the filter with Escape', async () => {
    render(<Harness start={['site', 'area-a']} />);
    list('Area').focus();

    await userEvent.keyboard('gas');
    expect(within(list('Area')).getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('searchbox', { name: 'Filter area' })).toHaveValue('gas');

    await userEvent.keyboard('{Escape}');
    expect(within(list('Area')).getAllByRole('option')).toHaveLength(2);
  });

  it('filters from the filter box too', () => {
    render(<Harness start={['site', 'area-b']} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter equipment' }), { target: { value: 'recomp' } });

    expect(within(list('Equipment')).getAllByRole('option')).toHaveLength(1);
  });

  it('leaves shortcuts with a modifier alone', () => {
    render(<Harness start={['site', 'area-a']} />);

    fireEvent.keyDown(list('Area'), { key: 'a', ctrlKey: true });

    expect(screen.getByRole('searchbox', { name: 'Filter area' })).toHaveValue('');
  });

  it('replaces the columns to the right when a row further left is picked', async () => {
    render(<Harness start={['site', 'area-b', 'comp-3', 'vt']} />);

    await userEvent.click(screen.getByRole('option', { name: /Inlet and separation/ }));
    await userEvent.click(screen.getByRole('option', { name: /Inlet separator/ }));

    expect(within(list('Tag')).getAllByRole('option')).toHaveLength(1);
  });
});
