import { render, screen } from '@testing-library/react';

import { DaysSinceBanner } from './DaysSinceBanner';

describe(DaysSinceBanner.name, () => {
  it('names the region with the count and what it counts', () => {
    render(<DaysSinceBanner days={218} label="days since the last recordable incident" record={412} />);

    expect(screen.getByRole('region', { name: '218 days since the last recordable incident' })).toBeInTheDocument();
    expect(screen.getByText('218')).toBeInTheDocument();
  });

  it('measures the run against the record', () => {
    render(<DaysSinceBanner days={206} label="days" record={412} />);

    expect(screen.getByRole('meter', { name: 'Run against the site record' })).toHaveAttribute('aria-valuetext', '206 of 412 days');
    expect(screen.getByText('50 % of the record')).toBeInTheDocument();
    expect(screen.getByText('Record 412 days')).toBeInTheDocument();
  });

  it('caps the bar when the record is passed', () => {
    render(<DaysSinceBanner days={500} label="days" record={412} />);

    expect(screen.getByText('100 % of the record')).toBeInTheDocument();
  });

  it('shows the lesser counters and the last event', () => {
    render(<DaysSinceBanner days={218} label="days" record={412} lastEvent="Hand injury, 6 August 2025" counters={[{ label: 'since a first-aid case', days: 34 }]} />);

    expect(screen.getByText('Hand injury, 6 August 2025')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
    expect(screen.getByText('since a first-aid case')).toBeInTheDocument();
  });
});
