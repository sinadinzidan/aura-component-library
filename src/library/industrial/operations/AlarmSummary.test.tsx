import { render, screen, within } from '@testing-library/react';

import { AlarmSummary } from './AlarmSummary';

const COUNTS = { critical: 1, high: 2, medium: 0, low: 3 };

describe(AlarmSummary.name, () => {
  it('lists every severity with its count, most severe first', () => {
    render(<AlarmSummary counts={COUNTS} />);

    const group = screen.getByRole('group', { name: 'Alarms by severity' });
    const severities = Array.from(group.querySelectorAll('[data-severity]')).map((node) => node.getAttribute('data-severity'));
    expect(severities).toEqual(['critical', 'high', 'medium', 'low']);
    expect(within(group).getByText('Critical')).toBeInTheDocument();
  });

  it('quiets a severity with no alarms but keeps its place', () => {
    const { container } = render(<AlarmSummary counts={COUNTS} />);

    const medium = container.querySelector('[data-severity="medium"]');
    expect(medium).toHaveClass('opacity-50');
    expect(medium?.querySelector('[data-slot="status-dot"]')).toHaveAttribute('data-tone', 'neutral');
  });

  it('shows the total when asked', () => {
    render(<AlarmSummary counts={COUNTS} showTotal />);

    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('renders four figures as tiles', () => {
    const { container } = render(<AlarmSummary counts={COUNTS} variant="tiles" label="Open alarms" />);

    expect(container.querySelectorAll('[data-slot="value-readout"]')).toHaveLength(4);
    expect(screen.getByLabelText('Open alarms')).toBeInTheDocument();
  });
});
