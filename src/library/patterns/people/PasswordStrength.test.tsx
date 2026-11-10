import { render, screen } from '@testing-library/react';

import { PasswordStrength } from './PasswordStrength';

describe(PasswordStrength.name, () => {
  it('reports an empty password as not entered', () => {
    render(<PasswordStrength password="" />);

    expect(screen.getByRole('meter', { name: 'Password strength' })).toHaveAttribute('aria-valuetext', 'Not entered');
  });

  it('writes the level next to the meter', () => {
    render(<PasswordStrength password="Compressor-9101-train-A" />);

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '4');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('marks each rule as met or not met in text', () => {
    render(<PasswordStrength password="abcdefghijkl" />);

    expect(screen.getByText('At least 12 characters').closest('li')).toHaveTextContent(', met');
    expect(screen.getByText('A number').closest('li')).toHaveTextContent(', not met');
  });

  it('hides the checklist on request', () => {
    render(<PasswordStrength password="abc" showRules={false} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
