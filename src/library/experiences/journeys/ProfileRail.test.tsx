import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileRail } from './ProfileRail';
import type { ProfileSeries } from './ProfileRail';

const STOPS = ['Inlet', 'Separation', 'Compression', 'Export'];
const SERIES: ProfileSeries[] = [
  { id: 'pressure', label: 'Pressure', unit: 'barg', decimals: 1, values: [14.2, 13.1, 48.6, 139.5] },
  { id: 'temperature', label: 'Temperature', unit: '°C', decimals: 0, values: [31, 28, 141, 42] },
];

describe(ProfileRail.name, () => {
  it('draws one line per series and names the chart with the values at the current stop', () => {
    const { container } = render(<ProfileRail stops={STOPS} series={SERIES} activeIndex={2} label="Profile along the route" />);

    expect(container.querySelectorAll('[data-slot="profile-line"]')).toHaveLength(2);
    expect(screen.getByRole('img')).toHaveAccessibleName('Profile along the route. At Compression: Pressure 48.6 barg, Temperature 141 °C');
  });

  it('shows the values at the active stop in the legend', () => {
    const { container } = render(<ProfileRail stops={STOPS} series={SERIES} activeIndex={0} label="Profile" />);

    const values = [...container.querySelectorAll('[data-slot="profile-value"]')].map((node) => node.textContent);
    expect(values).toEqual(['14.2 barg', '31 °C']);
  });

  it('moves the cursor to the active stop', () => {
    const { container } = render(<ProfileRail stops={STOPS} series={SERIES} activeIndex={3} label="Profile" />);

    expect(container.querySelector('[data-slot="profile-cursor"]')).toHaveAttribute('x1', '525');
  });

  it('lets the user jump to a stop when selectable', async () => {
    const onSelect = vi.fn();
    render(<ProfileRail stops={STOPS} series={SERIES} activeIndex={0} onSelect={onSelect} label="Profile" />);

    await userEvent.click(screen.getByRole('button', { name: 'Go to Export' }));

    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('has no buttons when it is read-only', () => {
    render(<ProfileRail stops={STOPS} series={SERIES} activeIndex={0} label="Profile" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
