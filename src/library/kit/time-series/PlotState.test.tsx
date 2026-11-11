import { render, screen } from '@testing-library/react';

import { PlotState } from './PlotState';

describe(PlotState.name, () => {
  it('announces loading as a busy status', () => {
    render(<PlotState state="loading" title="Loading 7 days of data" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading 7 days of data')).toBeInTheDocument();
  });

  it('explains an empty range', () => {
    render(<PlotState state="empty" title="No data in this range" description="The transmitter was out of service." />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByText('The transmitter was out of service.')).toBeInTheDocument();
  });

  it('raises a failure as an alert with its action', () => {
    render(<PlotState state="error" title="Could not load the trend" action={<button type="button">Try again</button>} height={180} />);

    expect(screen.getByRole('alert')).toHaveStyle({ height: '180px' });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
