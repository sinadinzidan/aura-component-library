import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionSelect } from './OptionSelect';

const OPTIONS = [
  { value: 'P1', label: 'P1 – within 24 hours' },
  { value: 'P2', label: 'P2 – within 7 days' },
];

describe(OptionSelect.name, () => {
  it('shows the placeholder until a value is picked', () => {
    render(<OptionSelect options={OPTIONS} aria-label="Priority" placeholder="Select a priority" />);

    expect(screen.getByRole('combobox', { name: 'Priority' })).toHaveTextContent('Select a priority');
  });

  it('shows the label of the selected option, not its value', () => {
    render(<OptionSelect options={OPTIONS} aria-label="Priority" defaultValue="P2" />);

    expect(screen.getByRole('combobox', { name: 'Priority' })).toHaveTextContent('P2 – within 7 days');
  });

  it('reports the picked value', async () => {
    const onValueChange = vi.fn();
    render(<OptionSelect options={OPTIONS} aria-label="Priority" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Priority' }));
    await userEvent.click(await screen.findByRole('option', { name: 'P1 – within 24 hours' }));

    expect(onValueChange.mock.calls[0]?.[0]).toBe('P1');
  });

  it('passes the field wiring to the trigger', () => {
    render(
      <>
        <OptionSelect options={OPTIONS} id="priority" aria-label="Priority" aria-describedby="hint" aria-invalid />
        <p id="hint">Select how soon the work is needed.</p>
      </>
    );

    const trigger = screen.getByRole('combobox', { name: 'Priority' });
    expect(trigger).toHaveAttribute('id', 'priority');
    expect(trigger).toHaveAccessibleDescription('Select how soon the work is needed.');
    expect(trigger).toBeInvalid();
  });

  it('can be disabled', () => {
    render(<OptionSelect options={OPTIONS} aria-label="Priority" disabled />);

    expect(screen.getByRole('combobox', { name: 'Priority' })).toBeDisabled();
  });
});
