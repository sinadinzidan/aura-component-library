import { render, screen } from '@testing-library/react';

import { ThermalFrame } from './ThermalFrame';

const spots = [
  { id: 'brg', label: 'Bearing', x: 0.3, y: 0.5, peak: 92, radius: 0.1 },
  { id: 'cas', label: 'Casing', x: 0.7, y: 0.5, peak: 58, radius: 0.1 },
];

describe(ThermalFrame.name, () => {
  it('names the image and draws the temperature grid', () => {
    const { container } = render(<ThermalFrame label="Thermal image, bearing at 92 °C" spots={spots} min={30} max={100} ambient={30} />);

    expect(screen.getByRole('img', { name: 'Thermal image, bearing at 92 °C' })).toBeInTheDocument();
    expect(container.querySelector('[role="img"] > div')?.children).toHaveLength(32 * 18);
  });

  it('uses the hottest heat step near a hot spot', () => {
    const { container } = render(<ThermalFrame label="Thermal" spots={spots} min={30} max={100} ambient={30} />);

    expect(container.querySelector('.bg-heat-map-intense')).toBeInTheDocument();
  });

  it('prints readouts only for the chosen spots', () => {
    render(<ThermalFrame label="Thermal" spots={spots} min={30} max={100} ambient={30} readouts={['brg']} />);

    expect(screen.getByText('92.0 °C')).toBeInTheDocument();
    expect(screen.queryByText('58.0 °C')).not.toBeInTheDocument();
  });

  it('prints the scale ends', () => {
    render(<ThermalFrame label="Thermal" spots={spots} min={30} max={100} ambient={30} />);

    expect(screen.getByText('30 °C')).toBeInTheDocument();
    expect(screen.getByText('100 °C')).toBeInTheDocument();
  });
});
