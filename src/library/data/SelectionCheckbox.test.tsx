import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectionCheckbox } from './SelectionCheckbox';

describe(SelectionCheckbox.name, () => {
  it('is named by its label', () => {
    render(<SelectionCheckbox label="Select WO-104482" checked={false} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Select WO-104482' })).not.toBeChecked();
  });

  it('reports the next state when clicked', async () => {
    const onChange = vi.fn();
    render(<SelectionCheckbox label="Select row" checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('shows a mixed state when indeterminate', () => {
    render(<SelectionCheckbox label="Select all rows" checked={false} indeterminate onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('does not change when disabled', async () => {
    const onChange = vi.fn();
    render(<SelectionCheckbox label="Select row" checked={false} disabled onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
