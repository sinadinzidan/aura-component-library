import { render, screen } from '@testing-library/react';

import { TrendDelta } from './TrendDelta';

describe(TrendDelta.name, () => {
  it('shows a signed absolute change with its unit and caption', () => {
    render(<TrendDelta value={4.38} reference={4.21} decimals={2} unit="MSm³/d" caption="vs yesterday" />);

    expect(screen.getByText(/\+0\.17 MSm³\/d/)).toBeInTheDocument();
    expect(screen.getByText('vs yesterday')).toHaveClass('text-muted-foreground');
  });

  it('shows relative change as a percentage', () => {
    render(<TrendDelta value={110} reference={100} format="percent" />);

    expect(screen.getByText(/\+10\.0 %/)).toBeInTheDocument();
  });

  it('is success when the change goes in the good direction', () => {
    const { container } = render(<TrendDelta value={97.1} reference={96.4} goodDirection="up" />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('Up')).toHaveClass('sr-only');
  });

  it('is critical when the change goes against the good direction', () => {
    const { container } = render(<TrendDelta value={18.9} reference={12.4} goodDirection="down" />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'critical');
  });

  it('is success for a fall when down is good', () => {
    const { container } = render(<TrendDelta value={12.4} reference={18.9} goodDirection="down" />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('Down')).toBeInTheDocument();
  });

  it('stays neutral without a good direction', () => {
    const { container } = render(<TrendDelta value={5} reference={4} />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'neutral');
  });

  it('reports no change when the difference rounds to zero', () => {
    const { container } = render(<TrendDelta value={50.01} reference={50} goodDirection="up" />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByText('No change')).toBeInTheDocument();
  });

  it('shows an em dash for a percent change from zero', () => {
    render(<TrendDelta value={4} reference={0} format="percent" goodDirection="down" />);

    expect(screen.getByText(/\u2014/)).toBeInTheDocument();
  });
});
