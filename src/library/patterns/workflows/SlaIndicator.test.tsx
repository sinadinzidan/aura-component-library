import { render, screen } from '@testing-library/react';

import { SlaIndicator } from './SlaIndicator';

describe(SlaIndicator.name, () => {
  it('shows the time left, the deadline and the state in words', () => {
    render(<SlaIndicator label="Time to decide" remaining="5 h 20 min left" elapsed={0.33} state="on-track" due="Due 12 Mar, 20:00" />);

    expect(screen.getByText('5 h 20 min left')).toBeInTheDocument();
    expect(screen.getByText('Due 12 Mar, 20:00')).toBeInTheDocument();
    expect(screen.getByText('On track')).toBeInTheDocument();
  });

  it('exposes the elapsed share as a progress bar with readable text', () => {
    render(<SlaIndicator label="Time to decide" remaining="40 min left" elapsed={0.9} state="due-soon" />);

    const bar = screen.getByRole('progressbar', { name: 'Time to decide' });

    expect(bar).toHaveAttribute('aria-valuenow', '90');
    expect(bar).toHaveAttribute('aria-valuetext', '40 min left, due soon');
  });

  it('fills the bar and says overdue once the deadline has passed', () => {
    render(<SlaIndicator label="Time to decide" remaining="2 h overdue" elapsed={1.4} state="overdue" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('never reports less than zero', () => {
    render(<SlaIndicator label="Time to decide" remaining="8 h left" elapsed={-0.2} state="on-track" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
