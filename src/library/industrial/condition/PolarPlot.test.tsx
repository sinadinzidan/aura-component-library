import { render, screen } from '@testing-library/react';

import { PolarPlot } from './PolarPlot';
import { runUp } from './rotor';

const points = runUp({ criticalRpm: 3000, dampingRatio: 0.1, eccentricity: 10 }, 500, 6000, 40);

describe(PolarPlot.name, () => {
  it('draws the run-up curve and the angle spokes', () => {
    const { container } = render(<PolarPlot label="Polar plot" points={points} unit="µm" />);

    expect(screen.getByRole('img', { name: 'Polar plot' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="polar-path"]')).toBeInTheDocument();
    expect(screen.getByText('270°')).toBeInTheDocument();
  });

  it('prints the requested speeds beside the curve', () => {
    const { container } = render(<PolarPlot label="Polar plot" points={points} unit="µm" labelSpeeds={[1000, 3000, 5000]} />);

    expect(container.querySelectorAll('[data-slot="polar-speed"]')).toHaveLength(3);
  });
});
