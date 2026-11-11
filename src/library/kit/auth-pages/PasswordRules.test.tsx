import { render, screen } from '@testing-library/react';

import { PasswordRules } from './PasswordRules';
import { checkPassword } from './passwordRules';

describe(PasswordRules.name, () => {
  it('lists every rule with whether it is met', () => {
    render(<PasswordRules rules={checkPassword('abcdefghijkl')} />);

    expect(screen.getByText('At least 12 characters').textContent).toContain('(met)');
    expect(screen.getByText('A number').textContent).toContain('(not met)');
  });

  it('names the strength', () => {
    render(<PasswordRules rules={checkPassword('Nordkapp-2026#')} />);

    expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
  });
});
