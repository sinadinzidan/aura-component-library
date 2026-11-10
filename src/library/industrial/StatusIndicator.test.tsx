import { render, screen } from '@testing-library/react';

import { runStateStatus } from './status';
import { StatusIndicator } from './StatusIndicator';

describe(StatusIndicator.name, () => {
  it('always shows the state in words next to the dot', () => {
    const { container } = render(<StatusIndicator tone="success" label="Running" />);

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="status-dot"]')).toHaveAttribute('data-tone', 'success');
  });

  it('takes a descriptor from the status helpers', () => {
    const { container } = render(<StatusIndicator {...runStateStatus('tripped')} />);

    expect(screen.getByText('Tripped')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="status-dot"]')).toHaveAttribute('data-shape', 'diamond');
  });

  it('shows quiet detail after the label', () => {
    render(<StatusIndicator tone="info" label="Standby" detail="since 09:12" />);

    expect(screen.getByText('since 09:12')).toHaveClass('text-muted-foreground');
  });

  it('renders a badge without a dot in the badge variant', () => {
    const { container } = render(<StatusIndicator tone="critical" label="Tripped" variant="badge" />);

    expect(screen.getByText('Tripped')).toHaveAttribute('data-slot', 'status-indicator');
    expect(container.querySelector('[data-slot="status-dot"]')).not.toBeInTheDocument();
  });
});
