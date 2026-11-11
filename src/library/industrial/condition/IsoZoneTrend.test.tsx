import { render, screen } from '@testing-library/react';

import { ISO_10816_3 } from './isoZones';
import { IsoZoneTrend } from './IsoZoneTrend';

const points = [2.1, 3.4, 4.9, 6.8].map((v, index) => ({ t: index * 1000, v }));
const formatTime = (t: number) => `d${t / 1000}`;

describe(IsoZoneTrend, () => {
  it('shades and letters the four zones', () => {
    const { container } = render(<IsoZoneTrend label="Overall velocity" points={points} boundaries={ISO_10816_3.group1Rigid} formatTime={formatTime} />);

    expect(screen.getByRole('img', { name: 'Overall velocity' })).toBeInTheDocument();
    expect(Array.from(container.querySelectorAll('[data-slot="iso-zone-label"]')).map((node) => node.textContent)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('calls out the latest value with its zone in words', () => {
    render(<IsoZoneTrend label="Overall velocity" points={points} boundaries={ISO_10816_3.group1Rigid} formatTime={formatTime} />);

    expect(screen.getByText('zone C')).toBeInTheDocument();
    expect(screen.getByText('6.8')).toBeInTheDocument();
  });

  it('draws the trend line', () => {
    const { container } = render(<IsoZoneTrend label="Overall velocity" points={points} boundaries={ISO_10816_3.group1Rigid} formatTime={formatTime} />);

    expect(container.querySelector('[data-slot="iso-trend-line"]')).toBeInTheDocument();
  });
});
