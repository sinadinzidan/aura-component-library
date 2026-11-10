import { render, screen, within } from '@testing-library/react';

import { KpiTile } from './KpiTile';

describe(KpiTile.name, () => {
  it('shows label, value and unit as a named group', () => {
    render(<KpiTile label="Availability" value={96.4} unit="%" decimals={1} />);

    const tile = screen.getByRole('group', { name: 'Availability' });
    expect(within(tile).getByText('96.4')).toBeInTheDocument();
    expect(within(tile).getByText('%')).toBeInTheDocument();
  });

  it('shows the change against the reference with its judgement', () => {
    const { container } = render(
      <KpiTile label="Availability" value={96.4} unit="%" decimals={1} delta={{ reference: 97.1, goodDirection: 'up', caption: 'vs last week' }} />
    );

    expect(container.querySelector('[data-slot="trend-delta"]')).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('vs last week')).toBeInTheDocument();
  });

  it('shows the target in the value’s unit', () => {
    render(<KpiTile label="Gas export" value={4.38} unit="MSm³/d" decimals={2} target={{ value: 4.5 }} />);

    expect(screen.getByText('Target 4.50 MSm³/d')).toBeInTheDocument();
  });

  it('shows a described sparkline when given a trend', () => {
    render(<KpiTile label="OEE" value={82.7} unit="%" decimals={1} trend={{ values: [80, 81.5, 82.7], label: 'OEE, last 30 days' }} />);

    expect(screen.getByRole('img', { name: /^OEE, last 30 days: latest 82\.7/ })).toBeInTheDocument();
  });

  it('shows a status with its label in the header', () => {
    render(<KpiTile label="Flaring" value={12.4} status={{ tone: 'success', label: 'Within permit' }} />);

    expect(screen.getByText('Within permit')).toBeInTheDocument();
  });

  it('colours the value by tone', () => {
    render(<KpiTile label="Active alarms" value={4} tone="critical" />);

    expect(screen.getByText('4')).toHaveClass('text-critical-foreground-strong');
  });

  it('shows the footnote', () => {
    render(<KpiTile label="MTBF" value={412} unit="h" footnote="Rolling 12 months" />);

    expect(screen.getByText('Rolling 12 months')).toBeInTheDocument();
  });

  it('shows a skeleton and no value while loading', () => {
    const { container } = render(<KpiTile label="Availability" value={96.4} loading />);

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText('96')).not.toBeInTheDocument();
  });

  it('shows an em dash and the empty text without a value, and hides delta and trend', () => {
    const { container } = render(
      <KpiTile
        label="Bearing temperature"
        value={null}
        unit="°C"
        emptyText="Signal lost 9 h ago"
        delta={{ reference: 60 }}
        trend={{ values: [1, 2] }}
      />
    );

    expect(screen.getByText('\u2014')).toBeInTheDocument();
    expect(screen.getByText('Signal lost 9 h ago')).toBeInTheDocument();
    expect(screen.queryByText('°C')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="trend-delta"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="sparkline"]')).not.toBeInTheDocument();
  });

  it('exposes its size', () => {
    render(<KpiTile label="Availability" value={96.4} size="large" />);

    expect(screen.getByRole('group', { name: 'Availability' })).toHaveAttribute('data-size', 'large');
  });
});
