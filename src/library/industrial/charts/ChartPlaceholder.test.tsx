import { render, screen } from '@testing-library/react';

import { ChartPlaceholder } from './ChartPlaceholder';

describe(ChartPlaceholder.name, () => {
  it('announces loading as a status with the chart height', () => {
    render(<ChartPlaceholder state="loading" title="Loading discharge pressure" heightClassName="h-72" />);

    const status = screen.getByRole('status', { name: 'Loading discharge pressure' });
    expect(status).toHaveClass('h-72');
  });

  it('explains an empty result and offers the action', () => {
    render(
      <ChartPlaceholder
        state="empty"
        title="No data in this period"
        description="23-PT-92531 has no datapoints on 1 March."
        action={<button type="button">Show last 24 hours</button>}
      />
    );

    expect(screen.getByText('No data in this period')).toBeInTheDocument();
    expect(screen.getByText('23-PT-92531 has no datapoints on 1 March.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show last 24 hours' })).toBeInTheDocument();
  });

  it('marks a failed query as an error', () => {
    const { container } = render(<ChartPlaceholder state="error" title="Could not load the trend" />);

    expect(container.querySelector('[data-slot="chart-placeholder"]')).toHaveAttribute('data-state', 'error');
    expect(screen.getByText('Could not load the trend')).toBeInTheDocument();
  });
});
