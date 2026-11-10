import { render, screen } from '@testing-library/react';

import { AuthCard } from './AuthCard';

describe(AuthCard.name, () => {
  it('is a region named by its title', () => {
    render(<AuthCard title="Sign in to Nordkapp" />);

    expect(screen.getByRole('region', { name: 'Sign in to Nordkapp' })).toBeInTheDocument();
  });

  it('renders the title at the requested heading level', () => {
    render(<AuthCard title="Check your email" as="h1" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Check your email' })).toBeInTheDocument();
  });

  it('shows the description, the fields and the footer', () => {
    render(
      <AuthCard title="Sign in" description="Use your work account." footer="No account? Request access">
        <button type="button">Continue</button>
      </AuthCard>
    );

    expect(screen.getByText('Use your work account.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('No account? Request access');
  });

  it('leaves out the footer when there is none', () => {
    render(<AuthCard title="Sign in" />);

    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});
