import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChoiceCards } from './ChoiceCards';

const OPTIONS = [
  { id: 'daily', label: 'Daily', description: 'Every day shift' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

describe(ChoiceCards.name, () => {
  it('is a radio group with the chosen option checked', () => {
    render(<ChoiceCards label="Round type" options={OPTIONS} value="weekly" />);

    expect(screen.getByRole('radiogroup', { name: 'Round type' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Daily/ })).not.toBeChecked();
    expect(screen.getByText('Every day shift')).toBeInTheDocument();
  });

  it('reports a clicked option', async () => {
    const onChange = vi.fn();
    render(<ChoiceCards label="Round type" options={OPTIONS} value="weekly" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Monthly' }));

    expect(onChange).toHaveBeenCalledWith('monthly');
  });

  it('moves the choice with arrow keys and wraps around', async () => {
    const onChange = vi.fn();
    render(<ChoiceCards label="Round type" options={OPTIONS} value="monthly" onChange={onChange} />);

    screen.getByRole('radio', { name: 'Monthly' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowLeft}');

    expect(onChange).toHaveBeenNthCalledWith(1, 'daily');
    expect(onChange).toHaveBeenNthCalledWith(2, 'weekly');
  });
});
