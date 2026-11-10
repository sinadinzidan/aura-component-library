import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordInput } from './PasswordInput';

describe(PasswordInput.name, () => {
  it('hides the value by default', () => {
    render(<PasswordInput aria-label="Client secret" defaultValue="s3cret" />);

    expect(screen.getByLabelText('Client secret')).toHaveAttribute('type', 'password');
  });

  it('shows the value when the toggle is pressed', async () => {
    render(<PasswordInput aria-label="Client secret" defaultValue="s3cret" />);

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByLabelText('Client secret')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides the value again on a second press', async () => {
    render(<PasswordInput aria-label="Client secret" defaultValue="s3cret" />);

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));

    expect(screen.getByLabelText('Client secret')).toHaveAttribute('type', 'password');
  });

  it('starts visible when asked to', () => {
    render(<PasswordInput aria-label="Client secret" defaultValue="s3cret" defaultVisible />);

    expect(screen.getByLabelText('Client secret')).toHaveAttribute('type', 'text');
  });

  it('disables the toggle with the input', () => {
    render(<PasswordInput aria-label="Client secret" disabled />);

    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
  });
});
