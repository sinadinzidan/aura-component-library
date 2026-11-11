import { render, screen } from '@testing-library/react';

import { ChartFrame } from './ChartFrame';

describe(ChartFrame.name, () => {
  it('names the plot and gives it its height', () => {
    render(
      <ChartFrame label="Gas export, last 24 hours" height={200}>
        plot
      </ChartFrame>
    );

    const plot = screen.getByRole('img', { name: 'Gas export, last 24 hours' });
    expect(plot).toHaveTextContent('plot');
    expect(plot.style.height).toBe('200px');
  });

  it('shows headline, legend and notes', () => {
    const { container } = render(
      <ChartFrame label="Gas export" headline="4.38 now" legend={[{ label: 'Today', tone: 'accent' }]} notes="Dip after the trip.">
        plot
      </ChartFrame>
    );

    expect(screen.getByText('4.38 now')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Dip after the trip.')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-notes', 'true');
  });
});
