import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { TableToolbar } from './TableToolbar';

describe(TableToolbar.name, () => {
  it('reports what is typed in the search field', async () => {
    const onQueryChange = vi.fn();
    render(<Harness onQueryChange={onQueryChange} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search work orders' }), 'pump');

    expect(onQueryChange).toHaveBeenLastCalledWith('pump');
  });

  it('shows the summary, filters and actions', () => {
    render(
      <TableToolbar
        searchLabel="Search work orders"
        query=""
        onQueryChange={vi.fn()}
        summary="6 of 8 work orders"
        filters={<button type="button">Status</button>}
        actions={<button type="button">Export</button>}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('6 of 8 work orders');
    expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('removes one applied filter', async () => {
    const onRemoveChip = vi.fn();
    render(
      <TableToolbar
        searchLabel="Search work orders"
        query=""
        onQueryChange={vi.fn()}
        chips={[{ id: 'p1', label: 'Priority: P1' }]}
        onRemoveChip={onRemoveChip}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Priority: P1' }));

    expect(onRemoveChip).toHaveBeenCalledWith('p1');
  });

  it('clears all applied filters', async () => {
    const onClearChips = vi.fn();
    render(
      <TableToolbar
        searchLabel="Search work orders"
        query=""
        onQueryChange={vi.fn()}
        chips={[{ id: 'p1', label: 'Priority: P1' }]}
        onClearChips={onClearChips}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onClearChips).toHaveBeenCalledTimes(1);
  });

  it('hides the chip row when no filters are applied', () => {
    render(<TableToolbar searchLabel="Search work orders" query="" onQueryChange={vi.fn()} onClearChips={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});

function Harness({ onQueryChange }: { onQueryChange: (query: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <TableToolbar
      searchLabel="Search work orders"
      query={query}
      onQueryChange={(next) => {
        setQuery(next);
        onQueryChange(next);
      }}
    />
  );
}
