import { render, screen } from '@testing-library/react';

import { BigStat } from './BigStat';

describe(BigStat.name, () => {
  it('shows the label, the formatted value and the unit', () => {
    render(<BigStat label="Gas export" value={4.38} unit="MSm³/d" decimals={2} />);

    expect(screen.getByRole('group', { name: 'Gas export: 4.38 MSm³/d' })).toBeInTheDocument();
    expect(screen.getByText('4.38')).toBeInTheDocument();
    expect(screen.getByText('MSm³/d')).toBeInTheDocument();
  });

  it('prints an em dash and no unit when there is no value', () => {
    render(<BigStat label="Gas export" value={null} unit="MSm³/d" />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('MSm³/d')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Gas export: no data' })).toBeInTheDocument();
  });

  it('keeps the number neutral unless a tone is given', () => {
    const { container, rerender } = render(<BigStat label="Open alarms" value={4} />);
    expect(container.querySelector('[data-slot="big-stat-value"]')).toHaveClass('text-base-foreground');

    rerender(<BigStat label="Open alarms" value={4} tone="critical" />);
    expect(container.querySelector('[data-slot="big-stat-value"]')).toHaveClass('text-critical-foreground-strong');
  });

  it('grows with the size', () => {
    const { container, rerender } = render(<BigStat label="Availability" value={96} size="lg" />);
    expect(container.querySelector('[data-slot="big-stat-value"]')).toHaveClass('text-6xl');

    rerender(<BigStat label="Availability" value={96} size="2xl" />);
    expect(container.querySelector('[data-slot="big-stat-value"]')).toHaveClass('text-9xl');
  });

  it('states the status in words with an icon', () => {
    const { container } = render(<BigStat label="Gas export" value={4.38} status={{ tone: 'warning', label: 'Under plan' }} />);

    const status = container.querySelector('[data-slot="big-stat-status"]');
    expect(status).toHaveTextContent('Under plan');
    expect(status?.querySelector('svg')).toHaveClass('text-warning-foreground-strong');
  });

  it('renders the caption and extra content', () => {
    render(
      <BigStat label="Gas export" value={4.38} caption="Plan 4.50">
        <p>Target bar</p>
      </BigStat>
    );

    expect(screen.getByText('Plan 4.50')).toBeInTheDocument();
    expect(screen.getByText('Target bar')).toBeInTheDocument();
  });
});
