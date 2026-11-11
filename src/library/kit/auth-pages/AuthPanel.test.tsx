import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { AuthPanel } from './AuthPanel';

describe(AuthPanel.name, () => {
  it('shows the heading, the sentence, the form and the footer', () => {
    render(
      <AuthPanel title="Sign in to Nordkapp" description="Use your work account." footer="New here? Ask an admin.">
        <button type="button">Continue</button>
      </AuthPanel>,
    );

    expect(screen.getByRole('heading', { name: 'Sign in to Nordkapp' })).toBeInTheDocument();
    expect(screen.getByText('Use your work account.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByText('New here? Ask an admin.')).toBeInTheDocument();
  });

  it('takes the display scale of the look', () => {
    render(
      <LookScope look="poster">
        <AuthPanel title="Sign in" />
      </LookScope>,
    );

    expect(screen.getByRole('heading', { name: 'Sign in' })).toHaveClass('text-4xl');
  });
});
