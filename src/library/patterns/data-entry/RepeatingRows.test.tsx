import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { RepeatingRows } from './RepeatingRows';

type Limit = { id: string; name: string };

const ROWS: Limit[] = [
  { id: 'high', name: 'High' },
  { id: 'low', name: 'Low' },
];

describe(RepeatingRows.name, () => {
  it('renders one row per entry inside a named group', () => {
    renderRows({});

    const group = screen.getByRole('group', { name: 'Alarm limits' });
    expect(group).toContainElement(screen.getByText('High'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('asks for a new row from the add button', async () => {
    const onAdd = vi.fn();
    renderRows({ onAdd });

    await userEvent.click(screen.getByRole('button', { name: 'Add limit' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('removes the row whose button was pressed', async () => {
    const onRemove = vi.fn();
    renderRows({ onRemove });

    await userEvent.click(screen.getByRole('button', { name: 'Remove limit 2' }));

    expect(onRemove).toHaveBeenCalledWith('low');
  });

  it('keeps the minimum number of rows', () => {
    renderRows({ minRows: 2 });

    expect(screen.getByRole('button', { name: 'Remove limit 1' })).toBeDisabled();
  });

  it('stops adding at the maximum and says why', () => {
    renderRows({ maxRows: 2, maxReason: 'A tag can have up to 2 limits.' });

    expect(screen.getByRole('button', { name: 'Add limit' })).toBeDisabled();
    expect(screen.getByText('A tag can have up to 2 limits.')).toBeInTheDocument();
  });

  it('falls back to a generated reason at the maximum', () => {
    renderRows({ maxRows: 2 });

    expect(screen.getByText('You can add up to 2.')).toBeInTheDocument();
  });
});

function renderRows(overrides: Partial<ComponentProps<typeof RepeatingRows<Limit>>>) {
  return render(
    <TooltipProvider>
      <RepeatingRows<Limit>
        label="Alarm limits"
        rows={ROWS}
        renderRow={(row) => <span>{row.name}</span>}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        addLabel="Add limit"
        removeLabel={(_row, index) => `Remove limit ${index + 1}`}
        {...overrides}
      />
    </TooltipProvider>
  );
}
