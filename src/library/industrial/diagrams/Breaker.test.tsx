import { render, screen } from '@testing-library/react';

import { Breaker } from './Breaker';

describe(Breaker.name, () => {
  it('names the breaker with its state', () => {
    render(<Breaker state="closed" label="Q11 Export pump A" />);

    expect(screen.getByRole('img', { name: 'Q11 Export pump A, closed' })).toHaveAttribute('data-state', 'closed');
  });

  it('has a default name', () => {
    render(<Breaker state="open" />);

    expect(screen.getByRole('img', { name: 'Breaker, open' })).toBeInTheDocument();
  });

  it('fills the contact when closed', () => {
    const { container } = render(<Breaker state="closed" />);

    expect(container.querySelector('[data-slot="breaker-contact"]')).toHaveAttribute('fill', 'currentColor');
  });

  it('leaves the contact hollow when open', () => {
    const { container } = render(<Breaker state="open" />);

    expect(container.querySelector('[data-slot="breaker-contact"]')).toHaveAttribute('fill', 'none');
    expect(screen.getByRole('img')).toHaveClass('text-medium-foreground');
  });

  it('crosses the contact and turns critical when tripped', () => {
    const { container } = render(<Breaker state="tripped" />);

    expect(container.querySelector('[data-slot="breaker-trip"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="breaker-contact"]')).toHaveAttribute('fill', 'none');
    expect(screen.getByRole('img')).toHaveClass('text-critical-foreground-strong');
  });

  it('turns to sit in a horizontal bus tie', () => {
    const { container } = render(<Breaker state="open" orientation="horizontal" />);

    expect(container.querySelector('g')).toHaveAttribute('transform', 'rotate(90 12 12)');
  });

  it('centres itself in a diagram when given a position', () => {
    render(
      <svg>
        <Breaker state="closed" size={24} cx={60} cy={40} />
      </svg>
    );

    expect(screen.getByRole('img', { name: 'Breaker, closed' })).toHaveAttribute('x', '48');
    expect(screen.getByRole('img', { name: 'Breaker, closed' })).toHaveAttribute('y', '28');
  });
});
