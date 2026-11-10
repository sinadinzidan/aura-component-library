import { render, screen, within } from '@testing-library/react';

import { TankInventoryTile } from './TankInventoryTile';

const PROPS = { tag: '27-TA-3001', product: 'Stabilised condensate', capacity: 5000 };

describe(TankInventoryTile.name, () => {
  it('names the tile by product and tag', () => {
    render(<TankInventoryTile {...PROPS} volume={3400} />);

    expect(screen.getByRole('group', { name: 'Stabilised condensate, tank 27-TA-3001' })).toBeInTheDocument();
  });

  it('shows level, volume and ullage', () => {
    render(<TankInventoryTile {...PROPS} volume={3400} />);

    const tile = screen.getByRole('group');
    expect(within(tile).getByText('68.0')).toBeInTheDocument();
    expect(within(tile).getByText('3,400')).toBeInTheDocument();
    expect(within(tile).getByText('1,600')).toBeInTheDocument();
  });

  it('stays neutral with no state inside the limits', () => {
    const { container } = render(<TankInventoryTile {...PROPS} volume={3400} limits={{ low: 15, high: 85, highHigh: 92 }} />);

    expect(container.querySelector('[data-slot="tank-inventory-tile"]')).toHaveAttribute('data-tone', 'neutral');
    expect(screen.queryByText(/level$/)).not.toBeInTheDocument();
  });

  it('names a high level above the high limit', () => {
    render(<TankInventoryTile {...PROPS} volume={4400} limits={{ low: 15, high: 85, highHigh: 92 }} />);

    expect(screen.getByText('High level')).toBeInTheDocument();
  });

  it('names a low-low level at the trip limit', () => {
    render(<TankInventoryTile {...PROPS} volume={200} limits={{ lowLow: 5, low: 15 }} />);

    expect(screen.getByText('Low-low level')).toBeInTheDocument();
  });

  it('shows the movement with its rate', () => {
    const { container } = render(<TankInventoryTile {...PROPS} volume={3400} movement={{ direction: 'filling', rate: 42, rateUnit: 'm³/h' }} />);

    expect(container.querySelector('[data-slot="tank-movement"]')).toHaveTextContent('Filling at 42 m³/h');
  });

  it('prefers a given status over the limits', () => {
    render(<TankInventoryTile {...PROPS} volume={3400} status={{ tone: 'warning', label: 'Out of service', shape: 'square' }} />);

    expect(screen.getByText('Out of service')).toBeInTheDocument();
  });

  it('shows dashes when there is no reading', () => {
    render(<TankInventoryTile {...PROPS} volume={null} />);

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });
});
