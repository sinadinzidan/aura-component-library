import { render, screen } from '@testing-library/react';

import { StockLevelBar } from './StockLevelBar';

const LEVELS = { min: 2, reorderPoint: 4, max: 10 };

describe(StockLevelBar.name, () => {
  it('describes stock and its levels in the accessible name', () => {
    render(<StockLevelBar label="Mechanical seal" onHand={6} unit="ea" {...LEVELS} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Mechanical seal: 6\u00a0ea on hand, in range; minimum 2, reorder point 4, maximum 10'
    );
  });

  it('stays neutral and shows no state while stock is in range', () => {
    const { container } = render(<StockLevelBar label="Mechanical seal" onHand={6} {...LEVELS} />);

    expect(container.querySelector('[data-slot="stock-level-bar"]')).toHaveAttribute('data-tone', 'neutral');
    expect(screen.queryByText('In range')).not.toBeInTheDocument();
  });

  it('writes "Reorder" at the reorder point', () => {
    const { container } = render(<StockLevelBar label="Mechanical seal" onHand={4} {...LEVELS} />);

    expect(container.querySelector('[data-slot="stock-level-bar"]')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('Reorder', { selector: '[data-slot="status-indicator"] *' })).toBeInTheDocument();
  });

  it('writes "Below minimum" under the minimum', () => {
    render(<StockLevelBar label="Mechanical seal" onHand={1} {...LEVELS} />);

    expect(screen.getByText('Below minimum')).toBeInTheDocument();
  });

  it('draws a tick for minimum, reorder point and maximum', () => {
    const { container } = render(<StockLevelBar label="Mechanical seal" onHand={6} {...LEVELS} />);

    const ticks = [...container.querySelectorAll<HTMLElement>('[data-slot="stock-tick"]')];
    expect(ticks.map((tick) => tick.dataset.tick)).toEqual(['min', 'reorder', 'max']);
  });

  it('splits the bar into available and reserved stock', () => {
    const { container } = render(<StockLevelBar label="Mechanical seal" onHand={5.6} reserved={2.8} decimals={1} min={2} reorderPoint={4} max={10} />);

    // Scale ends at 10 × 1.12 = 11.2, so 2.8 is a quarter of it.
    const width = (slot: string) => parseFloat(container.querySelector<HTMLElement>(`[data-slot="${slot}"]`)?.style.width ?? '');
    expect(width('stock-available')).toBeCloseTo(25, 6);
    expect(width('stock-reserved')).toBeCloseTo(25, 6);
    expect(screen.getByRole('img')).toHaveAccessibleName(/2\.8 reserved$/);
  });

  it('hides the header and scale when turned off', () => {
    render(<StockLevelBar label="Mechanical seal" onHand={6} {...LEVELS} showHeader={false} showScale={false} />);

    expect(screen.queryByText('Mechanical seal')).not.toBeInTheDocument();
    expect(screen.queryByText('Max')).not.toBeInTheDocument();
  });
});
