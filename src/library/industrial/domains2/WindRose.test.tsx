import { render, screen } from '@testing-library/react';

import { COMPASS_8 } from './polar';
import { WindRose } from './WindRose';

const SHARES = [6, 5, 4, 8, 14, 27, 22, 14];
const SECTORS = COMPASS_8.map((direction, index) => ({ direction, value: SHARES[index] }));

describe(WindRose.name, () => {
  it('names the prevailing direction in the accessible name', () => {
    render(<WindRose label="Wind direction, last 30 days" sectors={SECTORS} />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Wind direction, last 30 days: prevailing SW, 27 %');
  });

  it('draws one sector per direction and marks the prevailing one', () => {
    const { container } = render(<WindRose label="Wind direction" sectors={SECTORS} />);

    expect(container.querySelectorAll('[data-slot="wind-rose-sector"]')).toHaveLength(8);
    expect(container.querySelectorAll('[data-prevailing="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-prevailing="true"] title')).toHaveTextContent('SW: 27 %');
  });

  it('labels every direction around the rose', () => {
    render(<WindRose label="Wind direction" sectors={SECTORS} />);

    for (const direction of ['N', 'NE', 'E', 'SE', 'S', 'W', 'NW']) expect(screen.getByText(direction)).toBeInTheDocument();
  });

  it('rounds the scale up to whole rings', () => {
    render(<WindRose label="Wind direction" sectors={SECTORS} rings={3} />);

    for (const ring of ['9', '18']) expect(screen.getByText(ring)).toBeInTheDocument();
    expect(screen.getAllByText('27').length).toBeGreaterThan(0);
  });

  it('takes a unit and decimals', () => {
    render(<WindRose label="Mean wind speed by direction" sectors={[{ direction: 'N', value: 7.4 }, { direction: 'S', value: 9.8 }]} unit="m/s" decimals={1} />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Mean wind speed by direction: prevailing S, 9.8 m/s');
  });

  it('says so when there is no data', () => {
    render(<WindRose label="Wind direction" sectors={[]} />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
