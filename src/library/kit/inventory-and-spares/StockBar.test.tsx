import { render, screen } from '@testing-library/react';

import { StockBar } from './StockBar';

describe(StockBar.name, () => {
  it('reports on-hand and free stock with the verdict', () => {
    render(<StockBar label="Mechanical seal" onHand={6} reserved={1} onOrder={0} min={2} reorderPoint={4} max={10} />);

    const meter = screen.getByRole('meter', { name: 'Mechanical seal' });
    expect(meter).toHaveAttribute('aria-valuenow', '6');
    expect(meter).toHaveAttribute('aria-valuetext', '6 pcs on hand, 5 free, healthy');
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('1 reserved')).toBeInTheDocument();
    expect(screen.queryByText(/on order/)).toBeNull();
  });

  it('names the minimum, reorder point and maximum', () => {
    render(<StockBar label="Seal" onHand={6} reserved={0} onOrder={0} min={2} reorderPoint={4} max={10} />);

    expect(screen.getByText('Min 2')).toBeInTheDocument();
    expect(screen.getByText('Reorder 4')).toBeInTheDocument();
    expect(screen.getByText('Max 10')).toBeInTheDocument();
  });

  it('merges the minimum and the reorder point when they are the same', () => {
    render(<StockBar label="Gasket set" onHand={1} reserved={0} onOrder={0} min={1} reorderPoint={1} max={2} />);

    expect(screen.getByText('Min and reorder 1')).toBeInTheDocument();
    expect(screen.queryByText('Reorder 1')).toBeNull();
  });

  it('flags stock below minimum and mentions what is on order', () => {
    render(<StockBar label="Bearing" onHand={1} reserved={1} onOrder={2} min={2} reorderPoint={3} max={4} />);

    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('Below minimum')).toBeInTheDocument();
    expect(screen.getByText('2 on order')).toBeInTheDocument();
  });

  it('can leave the verdict to a pill beside it', () => {
    render(<StockBar label="Bearing" hideVerdict onHand={1} reserved={0} onOrder={0} min={2} reorderPoint={3} max={4} />);

    expect(screen.queryByText('Below minimum')).toBeNull();
  });
});
