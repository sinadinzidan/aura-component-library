import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterPopover } from './FilterPopover';
import type { FilterGroup, FilterValue } from './FilterPopover';

describe(FilterPopover.name, () => {
  it('shows the number of applied filters on the trigger', () => {
    renderPopover({ state: ['running'], criticality: ['A'] });

    expect(screen.getByRole('button', { name: /Filters/ })).toHaveTextContent('2');
  });

  it('shows no count when nothing is applied', () => {
    renderPopover({});

    expect(screen.getByRole('button', { name: /Filters/ })).toHaveTextContent(/^\s*Filters\s*$/);
  });

  it('opens with the applied filters checked', async () => {
    renderPopover({ state: ['running'] });

    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));

    expect(screen.getByRole('checkbox', { name: 'Running' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Tripped' })).not.toBeChecked();
  });

  it('applies the edited selection and closes', async () => {
    const { onApply } = renderPopover({ state: ['running'] });
    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Tripped' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onApply).toHaveBeenCalledWith({ state: ['running', 'tripped'], criticality: ['A'] });
    expect(screen.queryByRole('checkbox', { name: 'Tripped' })).not.toBeInTheDocument();
  });

  it('does not apply anything until the user asks', async () => {
    const { onApply } = renderPopover({});
    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Tripped' }));

    expect(onApply).not.toHaveBeenCalled();
  });

  it('discards an abandoned draft the next time it opens', async () => {
    renderPopover({});
    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tripped' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));

    expect(screen.getByRole('checkbox', { name: 'Tripped' })).not.toBeChecked();
  });

  it('clears the whole draft with one action', async () => {
    const { onApply } = renderPopover({ state: ['running'], criticality: ['A'] });
    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onApply).toHaveBeenCalledWith({ state: [], criticality: [] });
  });
});

const GROUPS: readonly FilterGroup[] = [
  {
    id: 'state',
    label: 'Run state',
    options: [
      { id: 'running', label: 'Running' },
      { id: 'tripped', label: 'Tripped' },
    ],
  },
  {
    id: 'criticality',
    label: 'Criticality',
    options: [
      { id: 'A', label: 'A' },
      { id: 'B', label: 'B' },
    ],
  },
];

function renderPopover(value: FilterValue) {
  const onApply = vi.fn();
  render(<FilterPopover groups={GROUPS} value={value} onApply={onApply} />);
  return { onApply };
}
