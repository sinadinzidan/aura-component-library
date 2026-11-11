import { render, screen } from '@testing-library/react';

import { TemperatureRail } from './TemperatureRail';

const SCALE = { warm: 30, cold: -162 };

describe(TemperatureRail.name, () => {
  it('describes the temperature at the current stop', () => {
    render(<TemperatureRail temperature={-162} scale={SCALE} subject="Storage" />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Process temperature at Storage: −162 °C');
  });

  it('places the marker at the warm end for ambient and the cold end for LNG', () => {
    const { container, rerender } = render(<TemperatureRail temperature={30} scale={SCALE} />);
    const top = () => container.querySelector<HTMLElement>('[data-slot="temperature-marker"]')?.style.top;

    expect(top()).toBe('0%');
    rerender(<TemperatureRail temperature={-162} scale={SCALE} />);
    expect(top()).toBe('100%');
  });

  it('shows no marker and a generic description in the overview', () => {
    const { container } = render(<TemperatureRail temperature={null} scale={SCALE} />);

    expect(container.querySelector('[data-slot="temperature-marker"]')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName('Process temperature, from ambient to cold');
  });

  it('prints the temperature next to the marker and labels the ticks', () => {
    render(<TemperatureRail temperature={-30} scale={SCALE} ticks={[30, -162]} />);

    expect(screen.getByText('−30 °C', { normalizer: (text) => text })).toBeInTheDocument();
    expect(screen.getByText('30 °C', { normalizer: (text) => text })).toBeInTheDocument();
    expect(screen.getByText('−162 °C', { normalizer: (text) => text })).toBeInTheDocument();
  });
});
