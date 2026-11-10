import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingSwitchRow } from './SettingSwitchRow';

describe(SettingSwitchRow.name, () => {
  it('names the switch after the label and describes it with the description', () => {
    render(
      <SettingSwitchRow
        label="Email me on trips"
        description="One email per tripped asset."
        checked={false}
        onCheckedChange={vi.fn()}
      />
    );

    const control = screen.getByRole('switch', { name: 'Email me on trips' });
    expect(control).toHaveAccessibleDescription('One email per tripped asset.');
  });

  it('reports the next state when the switch is clicked', async () => {
    const onCheckedChange = vi.fn();
    render(<SettingSwitchRow label="Email me on trips" checked={false} onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Email me on trips' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles from the label text', async () => {
    const onCheckedChange = vi.fn();
    render(<SettingSwitchRow label="Email me on trips" checked onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByText('Email me on trips'));

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('disables the switch and shows the reason instead of the description', () => {
    render(
      <SettingSwitchRow
        label="Write back to source"
        description="Sends set points to the control system."
        checked={false}
        onCheckedChange={vi.fn()}
        disabledReason="Only plant admins can change this."
      />
    );

    const control = screen.getByRole('switch', {
      name: 'Write back to source',
    });
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).toHaveAccessibleDescription('Only plant admins can change this.');
    expect(screen.queryByText('Sends set points to the control system.')).not.toBeInTheDocument();
  });
});
