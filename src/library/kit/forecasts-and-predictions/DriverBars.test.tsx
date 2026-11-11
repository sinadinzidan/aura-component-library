import { render, screen, within } from '@testing-library/react';

import { DriverBars } from './DriverBars';

const DRIVERS = [
  { label: 'Oil temperature', impact: -4 },
  { label: 'Drive-end vibration', impact: 18, detail: '6.8 mm/s' },
  { label: 'Running hours', impact: 9 },
];

describe(DriverBars.name, () => {
  it('lists the drivers largest first with signed figures', () => {
    render(<DriverBars label="Drivers of failure risk" drivers={DRIVERS} unit=" pts" />);

    const items = within(screen.getByRole('list', { name: 'Drivers of failure risk' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Drive-end vibration6.8 mm/s+18 pts', 'Running hours+9 pts', 'Oil temperature−4 pts']);
  });

  it('marks the drivers that make it worse', () => {
    render(<DriverBars label="Drivers" drivers={DRIVERS} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-tone', 'warning');
    expect(items[2]).toHaveAttribute('data-tone', 'success');
  });

  it('flips the judgement when down is the bad direction', () => {
    render(<DriverBars label="Drivers" drivers={DRIVERS} bad="down" />);

    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-tone', 'success');
  });
});
