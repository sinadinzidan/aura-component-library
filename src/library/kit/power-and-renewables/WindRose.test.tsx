import { render, screen } from '@testing-library/react';

import { WindRose, type WindSector } from './WindRose';

const SECTORS: WindSector[] = [
  { direction: 'N', value: 6 },
  { direction: 'E', value: 13 },
  { direction: 'S', value: 28 },
  { direction: 'W', value: 15 },
];

describe(WindRose.name, () => {
  it('draws a wedge per sector and marks the prevailing one', () => {
    const { container } = render(<WindRose label="Wind direction" sectors={SECTORS} />);

    expect(container.querySelectorAll('[data-sector]')).toHaveLength(4);
    expect(container.querySelector('[data-prevailing]')).toHaveAttribute('data-sector', 'S');
  });

  it('says the prevailing direction in words', () => {
    render(<WindRose label="Wind direction" sectors={SECTORS} />);

    expect(screen.getByRole('img', { name: 'Wind direction. Prevailing from S, 28 per cent of the time.' })).toBeInTheDocument();
    expect(screen.getByText('28 %')).toBeInTheDocument();
  });
});
