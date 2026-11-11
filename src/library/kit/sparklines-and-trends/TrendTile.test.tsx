import { render, screen } from '@testing-library/react';

import { TrendTile } from './TrendTile';

describe(TrendTile.name, () => {
  it('shows the value with its unit, trend, aside and footnote', () => {
    render(<TrendTile label="Discharge pressure" detail="23-PT-92531" value={48.6} decimals={1} unit="barg" trend={<span>trend</span>} aside={<span>Normal</span>} footnote="46.6 to 50.7 in 24 h" />);

    const tile = screen.getByRole('group', { name: 'Discharge pressure' });
    expect(tile).toHaveAttribute('data-layout', 'stack');
    expect(tile).toHaveTextContent('48.6barg');
    expect(screen.getByText('23-PT-92531')).toBeInTheDocument();
    expect(screen.getByText('trend')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('46.6 to 50.7 in 24 h')).toBeInTheDocument();
  });

  it('lays out as a row and fills with its tone', () => {
    render(<TrendTile layout="row" filled tone="critical" label="Vibration" value="11.6" unit="mm/s" trend={<span>trend</span>} />);

    const tile = screen.getByRole('group', { name: 'Vibration' });
    expect(tile).toHaveAttribute('data-layout', 'row');
    expect(tile).toHaveAttribute('data-filled', 'true');
    expect(tile).toHaveAttribute('data-tone', 'critical');
  });
});
