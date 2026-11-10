import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterBar } from './FilterBar';
import type { FilterBarChip } from './FilterBar';

const CHIPS: FilterBarChip[] = [
  { id: 'site', label: 'Site', value: 'Nordkapp' },
  { id: 'priority', label: 'Priority', value: 'P1, P2' },
];

describe(FilterBar.name, () => {
  it('is a search landmark that holds the controls', () => {
    render(
      <FilterBar label="Filter work orders">
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    const bar = screen.getByRole('search', { name: 'Filter work orders' });
    expect(bar).toContainElement(screen.getByRole('textbox', { name: 'Search work orders' }));
  });

  it('has no chip row until a filter is applied', () => {
    render(
      <FilterBar label="Filter work orders" onClearAll={vi.fn()}>
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    expect(screen.queryByRole('list', { name: 'Applied filters' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
  });

  it('lists the applied filters as chips', () => {
    render(
      <FilterBar label="Filter work orders" chips={CHIPS}>
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    const list = screen.getByRole('list', { name: 'Applied filters' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('removes one filter from its chip', async () => {
    const onRemoveChip = vi.fn();
    render(
      <FilterBar label="Filter work orders" chips={CHIPS} onRemoveChip={onRemoveChip}>
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Priority: P1, P2' }));

    expect(onRemoveChip).toHaveBeenCalledWith('priority');
  });

  it('clears every filter at once', async () => {
    const onClearAll = vi.fn();
    render(
      <FilterBar label="Filter work orders" chips={CHIPS} onClearAll={onClearAll}>
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('announces the result count', () => {
    render(
      <FilterBar label="Filter work orders" summary="3 of 8 work orders">
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    expect(screen.getByText('3 of 8 work orders')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders trailing controls', () => {
    render(
      <FilterBar label="Filter work orders" end={<button type="button">Columns</button>}>
        <input aria-label="Search work orders" />
      </FilterBar>
    );

    expect(screen.getByRole('button', { name: 'Columns' })).toBeInTheDocument();
  });
});
