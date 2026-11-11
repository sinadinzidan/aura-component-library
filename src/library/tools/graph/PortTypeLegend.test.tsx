import { render, screen } from '@testing-library/react';

import { PortTypeLegend } from './PortTypeLegend';

describe(PortTypeLegend.name, () => {
  it('names every port type in a labelled list', () => {
    render(<PortTypeLegend />);

    expect(screen.getByRole('list', { name: 'Port types' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Time series')).toBeInTheDocument();
  });

  it('shows only the types asked for with their descriptions', () => {
    const { container } = render(<PortTypeLegend types={['number', 'text']} descriptions={{ number: 'A single reading' }} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('A single reading')).toBeInTheDocument();
    expect(container.querySelector('[data-port-type="number"]')).toBeInTheDocument();
  });
});
