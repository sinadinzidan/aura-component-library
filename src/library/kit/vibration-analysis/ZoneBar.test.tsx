import { render, screen } from '@testing-library/react';

import { ZoneBar } from './ZoneBar';

describe(ZoneBar.name, () => {
  it('fills the zone the reading is in and says it in words', () => {
    const { container } = render(<ZoneBar label="Pump drive end" value={5.2} />);

    expect(screen.getByRole('meter', { name: 'Pump drive end' })).toHaveAttribute('aria-valuetext', '5.2 mm/s, zone C, Alert');
    expect(screen.getByText('C · Alert')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(1);
  });

  it('writes the zone boundaries under the bar', () => {
    render(<ZoneBar label="Motor" value={1.2} boundaries={[1.4, 2.8, 4.5]} max={8} />);

    expect(screen.getByText('2.8')).toBeInTheDocument();
    expect(screen.getByText('A · Good')).toBeInTheDocument();
  });
});
