import { render, screen } from '@testing-library/react';

import { ValveSymbol } from './ValveSymbol';

describe(ValveSymbol.name, () => {
  it('names the valve with its position', () => {
    render(<ValveSymbol position="open" label="20-XV-1105" />);

    expect(screen.getByRole('img', { name: '20-XV-1105, open' })).toBeInTheDocument();
  });

  it('falls back to the valve type as its name', () => {
    render(<ValveSymbol type="control" position="closed" />);

    expect(screen.getByRole('img', { name: 'Control valve, closed' })).toHaveAttribute('data-kind', 'control-valve');
  });

  it('draws an open valve hollow', () => {
    const { container } = render(<ValveSymbol position="open" />);

    expect(container.querySelector('[data-role="body"]')).toHaveAttribute('fill-opacity', '0');
  });

  it('draws a closed valve solid', () => {
    const { container } = render(<ValveSymbol position="closed" />);

    expect(container.querySelector('[data-role="body"]')).toHaveAttribute('fill-opacity', '1');
  });

  it('fills only the upstream half while travelling', () => {
    const { container } = render(<ValveSymbol position="travelling" />);

    expect(container.querySelector('[data-slot="valve-travel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="body"]')).toHaveAttribute('fill-opacity', '0');
  });

  it('marks a failed valve with a cross and the critical tone', () => {
    const { container } = render(<ValveSymbol type="shutdown" position="failed" />);

    expect(container.querySelector('[data-slot="valve-fault"]')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('text-critical-foreground-strong');
  });

  it('stays neutral for normal positions', () => {
    render(<ValveSymbol position="closed" />);

    expect(screen.getByRole('img')).toHaveClass('text-medium-foreground');
  });

  it('lets the tone be overridden', () => {
    render(<ValveSymbol position="open" tone="warning" />);

    expect(screen.getByRole('img')).toHaveClass('text-warning-foreground-strong');
  });
});
