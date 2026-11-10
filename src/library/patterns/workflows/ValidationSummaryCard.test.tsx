import { render, screen } from '@testing-library/react';

import { ValidationSummaryCard } from './ValidationSummaryCard';

describe(ValidationSummaryCard.name, () => {
  it('shows the three counts with their labels', () => {
    render(<ValidationSummaryCard title="Validation" counts={{ valid: 1246, warnings: 26, errors: 12 }} />);

    expect(screen.getByRole('region', { name: 'Validation' })).toBeInTheDocument();
    expect(screen.getByText('Ready').closest('[data-part]')).toHaveTextContent('1,246');
    expect(screen.getByText('Warnings').closest('[data-part]')).toHaveTextContent('26');
    expect(screen.getByText('Errors').closest('[data-part]')).toHaveTextContent('12');
  });

  it('describes the strip for assistive technology', () => {
    render(<ValidationSummaryCard title="Validation" counts={{ valid: 10, warnings: 2, errors: 1 }} />);

    expect(screen.getByRole('img', { name: '10 ready, 2 with warnings, 1 with errors' })).toBeInTheDocument();
  });

  it('leaves the strip out when there is nothing to show', () => {
    render(<ValidationSummaryCard title="Validation" counts={{ valid: 0, warnings: 0, errors: 0 }} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the actions', () => {
    render(<ValidationSummaryCard title="Validation" counts={{ valid: 1, warnings: 0, errors: 0 }} actions={<button type="button">Review errors</button>} />);

    expect(screen.getByRole('button', { name: 'Review errors' })).toBeInTheDocument();
  });
});
