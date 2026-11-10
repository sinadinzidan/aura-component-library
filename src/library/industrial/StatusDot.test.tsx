import { render, screen } from '@testing-library/react';

import { StatusDot } from './StatusDot';

describe(StatusDot.name, () => {
  it('is hidden from assistive technology without a label', () => {
    const { container } = render(<StatusDot tone="success" />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('becomes a named image when given a label', () => {
    render(<StatusDot tone="critical" shape="diamond" label="Tripped" />);

    expect(screen.getByRole('img', { name: 'Tripped' })).toHaveAttribute('data-shape', 'diamond');
  });

  it('fills a dot with the tone colour', () => {
    render(<StatusDot tone="warning" label="Watch" />);

    expect(screen.getByRole('img', { name: 'Watch' }).lastElementChild).toHaveClass('bg-warning-foreground-strong', 'rounded-full');
  });

  it('draws a ring as an outline', () => {
    render(<StatusDot tone="info" shape="ring" label="Standby" />);

    expect(screen.getByRole('img', { name: 'Standby' }).lastElementChild).toHaveClass('border-2', 'border-info-foreground-strong');
  });

  it('adds a halo when pulsing', () => {
    const { container } = render(<StatusDot tone="critical" pulse />);

    expect(container.querySelector('[data-slot="status-dot-pulse"]')).toBeInTheDocument();
  });
});
