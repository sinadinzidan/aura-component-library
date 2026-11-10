import { render, screen } from '@testing-library/react';

import { OverviewNavigator } from './OverviewNavigator';

const HOUR = 3_600_000;
const TO = Date.UTC(2026, 2, 12, 14, 0, 0);
const FROM = TO - 40 * HOUR;
const VALUES = [48.1, 48.4, 49.0, 48.6, 47.9, 48.3];

describe(OverviewNavigator.name, () => {
  it('draws the overview trend under its label', () => {
    render(<OverviewNavigator values={VALUES} from={FROM} to={TO} value={[TO - 10 * HOUR, TO]} onValueChange={vi.fn()} stepMs={HOUR} label="Discharge pressure, last 40 hours" />);

    expect(screen.getByRole('img', { name: /^Discharge pressure, last 40 hours/ })).toBeInTheDocument();
  });

  it('highlights the visible window and dims the rest', () => {
    const { container } = render(
      <OverviewNavigator values={VALUES} from={FROM} to={TO} value={[TO - 30 * HOUR, TO - 10 * HOUR]} onValueChange={vi.fn()} stepMs={HOUR} label="Pressure" />
    );

    expect(container.querySelector('[data-slot="navigator-window"]')).toHaveStyle({ left: '25%', width: '50%' });
    const dims = container.querySelectorAll('[data-slot="navigator-dim"]');
    expect(dims[0]).toHaveStyle({ width: '25%' });
    expect(dims[1]).toHaveStyle({ width: '25%' });
  });

  it('offers a slider thumb for each edge of the window', () => {
    const { container } = render(
      <OverviewNavigator values={VALUES} from={FROM} to={TO} value={[TO - 10 * HOUR, TO]} onValueChange={vi.fn()} stepMs={HOUR} label="Pressure" />
    );

    expect(screen.getByRole('group', { name: 'Visible window of Pressure' })).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(2);
  });

  it('writes out the visible window', () => {
    render(<OverviewNavigator values={VALUES} from={FROM} to={TO} value={[TO - 8 * HOUR, TO]} onValueChange={vi.fn()} stepMs={HOUR} label="Pressure" />);

    expect(screen.getByText('12 Mar, 06:00 – 14:00')).toBeInTheDocument();
  });
});
