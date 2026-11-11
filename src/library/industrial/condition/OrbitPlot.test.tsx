import { render, screen } from '@testing-library/react';

import { OrbitPlot } from './OrbitPlot';
import { orbitPoints } from './rotor';

const points = orbitPoints({ xAmplitude: 40, yAmplitude: 30 });

describe(OrbitPlot.name, () => {
  it('draws the orbit with its keyphasor dot', () => {
    const { container } = render(<OrbitPlot label="Orbit at the drive end" points={points} unit="µm" />);

    expect(screen.getByRole('img', { name: 'Orbit at the drive end' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="orbit-path"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="orbit-keyphasor"]')).toBeInTheDocument();
  });

  it('draws a limit circle and a reference orbit when given', () => {
    const { container } = render(<OrbitPlot label="Orbit" points={points} unit="µm" limit={{ radius: 45, label: 'Alert 45' }} reference={points} />);

    expect(container.querySelector('[data-slot="orbit-limit"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="orbit-reference"]')).toBeInTheDocument();
    expect(screen.getByText('Alert 45')).toBeInTheDocument();
  });

  it('states the full scale and the rotation direction', () => {
    const { container } = render(<OrbitPlot label="Orbit" points={points} unit="µm" range={50} rotation="cw" />);

    expect(screen.getByText(/Full scale 50 µm/)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="orbit-rotation"]')).toBeInTheDocument();
  });
});
