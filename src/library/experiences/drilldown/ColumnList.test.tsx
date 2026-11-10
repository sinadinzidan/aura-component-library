import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ColumnList } from './ColumnList';
import { fixtureTree } from './drilldownFixture';

const tree = fixtureTree();
const machines = tree.byId.get('area-b')?.children ?? [];
const base = { title: 'Equipment', items: machines, total: machines.length, selectedId: 'comp-1', filter: '', onFilterChange: vi.fn(), onSelect: vi.fn() };

describe(ColumnList.name, () => {
  it('lists the nodes as options with state and a key figure', () => {
    render(<ColumnList {...base} />);
    const options = within(screen.getByRole('listbox', { name: 'Equipment' })).getAllByRole('option');

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('1st stage compressor');
    expect(options[0]).toHaveTextContent('72%');
    expect(options[1]).toHaveTextContent('Tripped');
  });

  it('marks the selected row and announces it as the active option', () => {
    render(<ColumnList {...base} />);
    const selected = screen.getByRole('option', { selected: true });

    expect(selected).toHaveTextContent('1st stage compressor');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-activedescendant', selected.id);
  });

  it('is in the tab order only when it is the active column', () => {
    const { rerender } = render(<ColumnList {...base} />);
    expect(screen.getByRole('listbox')).toHaveAttribute('tabindex', '-1');

    rerender(<ColumnList {...base} active />);

    expect(screen.getByRole('listbox')).toHaveAttribute('tabindex', '0');
  });

  it('selects a row on click', async () => {
    const onSelect = vi.fn();
    render(<ColumnList {...base} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('option', { name: /Recompressor/ }));

    expect(onSelect).toHaveBeenCalledWith('comp-3');
  });

  it('reports typing in the filter', () => {
    const onFilterChange = vi.fn();
    render(<ColumnList {...base} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter equipment' }), { target: { value: 'rec' } });

    expect(onFilterChange).toHaveBeenCalledWith('rec');
  });

  it('shows how many rows the filter kept', () => {
    render(<ColumnList {...base} items={machines.slice(1)} filter="rec" />);

    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('says when nothing matches the filter', () => {
    render(<ColumnList {...base} items={[]} filter="pump" />);

    expect(screen.getByText('Nothing matches “pump”')).toBeInTheDocument();
  });

  it('explains an empty column and disables its filter with a reason', () => {
    render(<ColumnList {...base} items={[]} total={0} selectedId={null} emptyText="Select an area to list its equipment" />);

    expect(screen.getByText('Select an area to list its equipment')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filter equipment: nothing to filter yet' })).toBeDisabled();
  });

  it('forwards keys pressed on the list', () => {
    const onListKeyDown = vi.fn();
    render(<ColumnList {...base} active onListKeyDown={onListKeyDown} />);

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });

    expect(onListKeyDown).toHaveBeenCalledTimes(1);
  });

  it('adds a chevron only to rows that have something below them', () => {
    const sensors = tree.byId.get('comp-1')?.children ?? [];
    const { container } = render(<ColumnList {...base} title="Tag" items={sensors} total={sensors.length} selectedId={null} />);

    expect(container.querySelector('[role="option"] svg')).not.toBeInTheDocument();
  });
});
