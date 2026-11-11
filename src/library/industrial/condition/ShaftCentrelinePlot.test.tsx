import { render, screen } from '@testing-library/react';

import { centrelinePosition } from './rotor';
import { ShaftCentrelinePlot } from './ShaftCentrelinePlot';

const samples = [0, 0.5, 1].map((fraction) => ({ ...centrelinePosition(fraction, { clearance: 100 }), label: `${fraction * 3000}` }));

describe(ShaftCentrelinePlot.name, () => {
  it('draws the clearance circle and the path', () => {
    const { container } = render(<ShaftCentrelinePlot label="Shaft centreline" samples={samples} clearance={100} unit="µm" />);

    expect(screen.getByRole('img', { name: 'Shaft centreline' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="centreline-clearance"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="centreline-path"]')).toBeInTheDocument();
  });

  it('labels the sampled speeds and the final eccentricity ratio', () => {
    const { container } = render(<ShaftCentrelinePlot label="Shaft centreline" samples={samples} clearance={100} unit="µm" />);

    expect(container.querySelectorAll('[data-slot="centreline-sample"]')).toHaveLength(3);
    expect(screen.getByText('Eccentricity ratio 0.45')).toBeInTheDocument();
  });
});
